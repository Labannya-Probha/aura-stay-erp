import { beforeEach, describe, expect, it, vi } from 'vitest'

const generateReportMock = vi.fn()
const toCsvMock = vi.fn()
const toPdfMock = vi.fn()

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
  toPdf: (...args) => toPdfMock(...args),
}))

const { processPdfReportJob } = await import('../../queues/pdfReport.queue.js')

describe('pdf report queue processor', () => {
  beforeEach(() => {
    generateReportMock.mockReset()
    toCsvMock.mockReset()
    toPdfMock.mockReset()
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
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const fromMock = vi.fn((bucketOrTable) => {
      if (bucketOrTable === 'exports') {
        return {
          upload: uploadMock,
          createSignedUrl: createSignedUrlMock,
        }
      }

      if (bucketOrTable === 'report_export_logs') {
        return {
          insert: insertMock,
        }
      }

      throw new Error(`Unexpected from() target: ${bucketOrTable}`)
    })

    const supabaseAdminClient = {
      storage: {
        from: fromMock,
      },
      from: fromMock,
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
          name: 'demo@aura-stay.local',
          role: 'ADMIN',
          tenantId: 'tenant-001',
        },
        format: 'csv',
        requestMeta: {
          ipAddress: '127.0.0.1',
          userAgent: 'vitest',
        },
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
        tenantId: 'tenant-001',
      },
      {
        id: 'u1',
        name: 'demo@aura-stay.local',
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
      'tenant-001/RPT-LIVE-001-job-123.csv',
      expect.any(Buffer),
      { contentType: 'text/csv', upsert: false },
    )

    expect(createSignedUrlMock).toHaveBeenCalledWith(
      'tenant-001/RPT-LIVE-001-job-123.csv',
      900,
    )

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-001',
        report_code: 'RPT-LIVE-001',
        export_format: 'csv',
        generated_by: 'u1',
        generated_by_name: 'demo@aura-stay.local',
      }),
    )

    expect(result).toEqual({
      reportCode: 'RPT-LIVE-001',
      format: 'csv',
      sizeBytes: Buffer.byteLength('document_no,net_amount\nLIVE-0001,1200\n'),
      downloadUrl: 'https://example.com/signed/report.csv',
      storagePath: 'tenant-001/RPT-LIVE-001-job-123.csv',
    })
  })

  it('emits real pdf payload with pdf extension and mime type', async () => {
    generateReportMock.mockResolvedValue({
      report: { code: 'RPT-IFRS-PNL', displayMode: 'financial_statement' },
      rows: [{ label: 'Revenue', amount: 1200 }],
      summary: {},
      audit: { generatedBy: 'finance@aura-stay.local' },
    })

    toPdfMock.mockReturnValue(Buffer.from('%PDF-1.7\n%test', 'utf-8'))

    const uploadMock = vi.fn().mockResolvedValue({ error: null })
    const createSignedUrlMock = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed/report.pdf' },
      error: null,
    })
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const fromMock = vi.fn((bucketOrTable) => {
      if (bucketOrTable === 'exports') {
        return {
          upload: uploadMock,
          createSignedUrl: createSignedUrlMock,
        }
      }

      if (bucketOrTable === 'report_export_logs') {
        return {
          insert: insertMock,
        }
      }

      throw new Error(`Unexpected from() target: ${bucketOrTable}`)
    })

    const result = await processPdfReportJob(
      {
        id: 'job-pdf-001',
        data: {
          reportCode: 'RPT-IFRS-PNL',
          params: { filters: { dateFrom: '2026-07-01', dateTo: '2026-07-31' } },
          user: {
            id: 'u1',
            name: 'finance@aura-stay.local',
            role: 'ADMIN',
            tenantId: 'tenant-001',
          },
          format: 'pdf',
        },
      },
      {
        storage: { from: fromMock },
        from: fromMock,
      },
    )

    expect(uploadMock).toHaveBeenCalledWith(
      'tenant-001/RPT-IFRS-PNL-job-pdf-001.pdf',
      expect.any(Buffer),
      { contentType: 'application/pdf', upsert: false },
    )

    expect(result).toEqual(
      expect.objectContaining({
        format: 'pdf',
        reportCode: 'RPT-IFRS-PNL',
        storagePath: 'tenant-001/RPT-IFRS-PNL-job-pdf-001.pdf',
      }),
    )
  })

  it('rejects non-pdf magic bytes for pdf format', async () => {
    generateReportMock.mockResolvedValue({
      report: { code: 'RPT-IFRS-PNL', displayMode: 'financial_statement' },
      rows: [{ label: 'Revenue', amount: 1200 }],
      summary: {},
      audit: {},
    })

    toPdfMock.mockReturnValue(Buffer.from('NOT-PDF', 'utf-8'))

    const fromMock = vi.fn(() => ({
      upload: vi.fn(),
      createSignedUrl: vi.fn(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }))

    await expect(
      processPdfReportJob(
        {
          id: 'job-pdf-invalid',
          data: {
            reportCode: 'RPT-IFRS-PNL',
            params: { filters: {} },
            user: { id: 'u1', tenantId: 'tenant-001', role: 'ADMIN' },
            format: 'pdf',
          },
        },
        {
          storage: { from: fromMock },
          from: fromMock,
        },
      ),
    ).rejects.toThrow('Generated PDF failed magic-byte validation.')
  })
})
