import { beforeEach, describe, expect, it, vi } from 'vitest'

const generateReportMock = vi.fn()
const toCsvMock = vi.fn()

vi.mock('bullmq', () => ({
  Queue: class {
    constructor() {}
  },
  Worker: class {
    constructor() {}
    on() {}
  },
}))

vi.mock('../../server/reporting/reportService.js', () => ({
  generateReport: (...args) => generateReportMock(...args),
}))

vi.mock('../../server/reporting/exporters.js', () => ({
  toCsv: (...args) => toCsvMock(...args),
  toExcel: vi.fn(),
  toPdfHtml: vi.fn(),
}))

const { processPdfReportJob } = await import('../../queues/pdfReport.queue.js')

describe('pdf report queue processor', () => {
  beforeEach(() => {
    generateReportMock.mockReset()
    toCsvMock.mockReset()
  })

  it('passes live report payload through exporter/storage path for csv jobs', async () => {
    const livePayload = {
      report: { code: 'RPT-LIVE-001' },
      rows: [{ document_no: 'LIVE-0001', net_amount: 1200 }],
      totals: { net_amount: 1200 },
    }

    generateReportMock.mockResolvedValue(livePayload)
    toCsvMock.mockReturnValue('document_no,net_amount\nLIVE-0001,1200\n')

    const uploadMock = vi.fn().mockResolvedValue({ error: null })
    const createSignedUrlMock = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed/report.csv' },
      error: null,
    })
    const fromMock = vi.fn(() => ({
      upload: uploadMock,
      createSignedUrl: createSignedUrlMock,
    }))

    const supabaseAdminClient = {
      storage: {
        from: fromMock,
      },
    }

    const job = {
      id: 'job-123',
      data: {
        reportCode: 'RPT-LIVE-001',
        params: {
          filters: {
            dateFrom: '2026-07-01',
            dateTo: '2026-07-31',
          },
        },
        user: {
          id: 'u1',
          role: 'ADMIN',
          tenantId: 'tenant-001',
        },
        format: 'csv',
      },
    }

    const result = await processPdfReportJob(job, supabaseAdminClient)

    expect(generateReportMock).toHaveBeenCalledWith(
      'RPT-LIVE-001',
      {
        filters: {
          dateFrom: '2026-07-01',
          dateTo: '2026-07-31',
        },
      },
      {
        id: 'u1',
        role: 'ADMIN',
        tenantId: 'tenant-001',
      },
    )

    expect(toCsvMock).toHaveBeenCalledWith(livePayload)
    const exportedPayload = toCsvMock.mock.calls[0][0]
    expect(exportedPayload.rows[0].document_no).toBe('LIVE-0001')
    expect(exportedPayload.rows[0].document_no).not.toBe('FC-20250601001')

    expect(fromMock).toHaveBeenCalledWith('exports')
    expect(uploadMock).toHaveBeenCalledWith(
      'report-exports/tenant-001/RPT-LIVE-001-job-123.csv',
      expect.any(Buffer),
      { contentType: 'text/csv', upsert: false },
    )

    expect(createSignedUrlMock).toHaveBeenCalledWith(
      'report-exports/tenant-001/RPT-LIVE-001-job-123.csv',
      3600,
    )

    expect(result).toEqual({
      reportCode: 'RPT-LIVE-001',
      format: 'csv',
      sizeBytes: Buffer.byteLength('document_no,net_amount\nLIVE-0001,1200\n'),
      downloadUrl: 'https://example.com/signed/report.csv',
      storagePath: 'report-exports/tenant-001/RPT-LIVE-001-job-123.csv',
    })
  })
})
