import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { redisConnection } from './connection.js'
import { generateReport } from '../server/reporting/reportService.js'
import { toCsv, toExcel, toPdf } from '../server/reporting/exporters.js'

export const pdfReportQueue = new Queue('pdf-reports', { connection: redisConnection })
const EXPORT_SIGNED_URL_TTL_SECONDS = 15 * 60

const isMainModule =
  typeof process.argv[1] === 'string' && fileURLToPath(import.meta.url) === process.argv[1]

export let pdfReportWorker = null

function validatePdfPayload(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('PDF export did not return a Buffer payload.')
  }

  const signature = buffer.subarray(0, 5).toString('utf-8')
  if (!signature.startsWith('%PDF-')) {
    throw new Error('Generated PDF failed magic-byte validation.')
  }
}

async function writeExportAuditLog(supabaseAdminClient, details) {
  const {
    jobId,
    reportCode,
    format,
    filters,
    user,
    requestMeta,
    storagePath,
    contentType,
    sizeBytes,
    exportStatus,
    errorMessage,
  } = details

  const { error } = await supabaseAdminClient.from('report_export_logs').insert({
    tenant_id: user.tenantId || null,
    export_job_id: jobId ? String(jobId) : null,
    report_code: reportCode,
    export_format: format,
    filters: filters || {},
    generated_by: user.id || null,
    generated_by_name: user.name || null,
    ip_address: requestMeta?.ipAddress || null,
    user_agent: requestMeta?.userAgent || null,
    storage_path: storagePath || null,
    mime_type: contentType || null,
    size_bytes: Number.isFinite(sizeBytes) ? sizeBytes : null,
    export_status: exportStatus || 'COMPLETED',
    error_message: errorMessage || null,
  })

  if (error) {
    throw new Error(`Failed to write export audit log: ${error.message}`)
  }
}

export async function processPdfReportJob(job, supabaseAdminClient) {
  const { reportCode, params, user, format, requestMeta } = job.data

  if (!user?.tenantId) {
    throw new Error('Tenant context is required for report export jobs.')
  }

  const normalizedParams = {
    ...(params || {}),
    tenantId: user.tenantId,
  }

  let reportCodeForAudit = reportCode
  let contentType
  let storagePath

  try {
    const payload = await generateReport(reportCode, normalizedParams, user)

    let buffer
    let extension

    if (format === 'excel') {
      buffer = Buffer.from(await toExcel(payload))
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      extension = 'xlsx'
    } else if (format === 'csv') {
      buffer = Buffer.from(toCsv(payload), 'utf-8')
      contentType = 'text/csv'
      extension = 'csv'
    } else if (format === 'pdf') {
      buffer = toPdf(payload)
      validatePdfPayload(buffer)
      contentType = 'application/pdf'
      extension = 'pdf'
    } else {
      throw new Error(`Unsupported report format: ${format}`)
    }

    reportCodeForAudit = payload.report.code
    storagePath = `${user.tenantId || 'unknown'}/${payload.report.code}-${job.id}.${extension}`

    const { error: uploadError } = await supabaseAdminClient.storage
      .from('exports')
      .upload(storagePath, buffer, { contentType, upsert: false })

    if (uploadError) {
      throw new Error(`Failed to store export: ${uploadError.message}`)
    }

    const { data: signedUrlData, error: signError } = await supabaseAdminClient.storage
      .from('exports')
      .createSignedUrl(storagePath, EXPORT_SIGNED_URL_TTL_SECONDS)

    if (signError) {
      throw new Error(`Failed to sign export URL: ${signError.message}`)
    }

    await writeExportAuditLog(supabaseAdminClient, {
      jobId: job.id,
      reportCode: reportCodeForAudit,
      format,
      filters: normalizedParams.filters,
      user,
      requestMeta,
      storagePath,
      contentType,
      sizeBytes: buffer.byteLength,
      exportStatus: 'COMPLETED',
    })

    return {
      reportCode: payload.report.code,
      format,
      sizeBytes: buffer.byteLength,
      downloadUrl: signedUrlData.signedUrl,
      storagePath,
    }
  } catch (error) {
    await writeExportAuditLog(supabaseAdminClient, {
      jobId: job.id,
      reportCode: reportCodeForAudit,
      format,
      filters: normalizedParams.filters,
      user,
      requestMeta,
      storagePath,
      contentType,
      exportStatus: 'FAILED',
      errorMessage: error.message,
    })

    throw error
  }
}

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

  pdfReportWorker = new Worker(
    'pdf-reports',
    async (job) => processPdfReportJob(job, supabaseAdmin),
    { connection: redisConnection, concurrency: 3 },
  )

  pdfReportWorker.on('failed', (job, err) => {
    console.error(`[pdf-reports] job ${job?.id} failed:`, err.message)
  })
}
