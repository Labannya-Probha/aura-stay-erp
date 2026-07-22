import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { redisConnection } from './connection.js'
import { generateReport } from '../server/reporting/reportService.js'
import { toCsv, toExcel, toPdfHtml } from '../server/reporting/exporters.js'

export const pdfReportQueue = new Queue('pdf-reports', { connection: redisConnection })

const isMainModule =
  typeof process.argv[1] === 'string' && fileURLToPath(import.meta.url) === process.argv[1]

export let pdfReportWorker = null

if (isMainModule) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the PDF report worker.',
    )
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  /**
   * Job payload shape (enqueued from server/reporting/routes.js):
   *   { reportCode, params, user: { id, email, role, reportCodes, tenantId }, format: 'excel' | 'csv' | 'pdf' }
   *
   * Heavy report generation (Excel/PDF-HTML rendering) now runs off the HTTP
   * request thread — the route just enqueues and returns a job id immediately.
   * The finished file is uploaded to Supabase Storage, and the caller polls
   * GET /api/reports/jobs/:jobId (see routes.js) for status + a download URL.
   */
  pdfReportWorker = new Worker(
    'pdf-reports',
    async (job) => {
      const { reportCode, params, user, format } = job.data

      const payload = generateReport(reportCode, params, user)

      let buffer
      let contentType
      let extension

      if (format === 'excel') {
        buffer = Buffer.from(await toExcel(payload))
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'xlsx'
      } else if (format === 'csv') {
        buffer = Buffer.from(toCsv(payload), 'utf-8')
        contentType = 'text/csv'
        extension = 'csv'
      } else {
        buffer = Buffer.from(toPdfHtml(payload), 'utf-8')
        contentType = 'text/html; charset=utf-8'
        extension = 'html'
      }

      const storagePath = `report-exports/${user.tenantId || 'unknown'}/${payload.report.code}-${job.id}.${extension}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('exports')
        .upload(storagePath, buffer, { contentType, upsert: false })

      if (uploadError) {
        throw new Error(`Failed to store export: ${uploadError.message}`)
      }

      const { data: signedUrlData, error: signError } = await supabaseAdmin.storage
        .from('exports')
        .createSignedUrl(storagePath, 60 * 60)

      if (signError) {
        throw new Error(`Failed to sign export URL: ${signError.message}`)
      }

      return {
        reportCode: payload.report.code,
        format,
        sizeBytes: buffer.byteLength,
        downloadUrl: signedUrlData.signedUrl,
        storagePath,
      }
    },
    { connection: redisConnection, concurrency: 3 },
  )

  pdfReportWorker.on('failed', (job, err) => {
    console.error(`[pdf-reports] job ${job?.id} failed:`, err.message)
  })
}
