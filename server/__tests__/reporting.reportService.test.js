import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.fn()
const reportCatalogMaybeSingleMock = vi.fn()

vi.mock('@supabase/supabase-js', () => {
  const fromMock = vi.fn((table) => {
    if (table === 'report_catalog') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: reportCatalogMaybeSingleMock,
            }),
          }),
        }),
      }
    }

    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }
  })

  return {
    createClient: () => ({
      auth: {
        getUser: async () => ({ data: null, error: null }),
      },
      from: fromMock,
      rpc: (...args) => rpcMock(...args),
    }),
  }
})

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_ANON_KEY = 'anon-test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'

const { generateReport } = await import('../reporting/reportService.js')

describe('reportService.generateReport', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    reportCatalogMaybeSingleMock.mockReset()
  })

  it('uses live source_function payload when report exists in report_catalog', async () => {
    reportCatalogMaybeSingleMock.mockResolvedValue({
      data: {
        report_code: 'RPT-LIVE-001',
        title: 'Live Revenue Report',
        slug: 'live-revenue-report',
        source_function: 'aeds_live_revenue_report',
        supports_print: true,
        supports_export_excel: true,
        supports_export_pdf: true,
        report_departments: {
          code: 'ACCOUNTS',
          name: 'Accounts',
          slug: 'accounts',
        },
      },
      error: null,
    })

    rpcMock
      .mockResolvedValueOnce({
        data: {
          fields: [
            {
              fieldKey: 'net_amount',
              label: 'Net Amount',
              alignment: 'right',
              dataType: 'currency',
              aggregation: 'SUM',
            },
          ],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          rows: [
            {
              document_no: 'LIVE-0001',
              net_amount: 1200,
            },
          ],
          summary: {
            total_revenue: 1200,
            room_revenue: 950,
            restaurant_revenue: 250,
          },
        },
        error: null,
      })

    const payload = await generateReport(
      'RPT-LIVE-001',
      {
        filters: {
          dateFrom: '2026-07-01',
          dateTo: '2026-07-31',
        },
      },
      {
        role: 'ADMIN',
        tenantId: 'tenant-001',
        name: 'qa-user',
      },
    )

    expect(rpcMock).toHaveBeenNthCalledWith(1, 'aeds_report_definition', {
      p_department_slug: 'accounts',
      p_report_slug: 'live-revenue-report',
      p_role: 'ADMIN',
    })

    expect(rpcMock).toHaveBeenNthCalledWith(2, 'aeds_live_revenue_report', {
      p_tenant_id: 'tenant-001',
      p_filters: {
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        as_of_date: '2026-07-31',
      },
    })

    expect(payload.report.code).toBe('RPT-LIVE-001')
    expect(payload.rows).toEqual([
      {
        document_no: 'LIVE-0001',
        net_amount: 1200,
      },
    ])

    expect(payload.rows[0].document_no).toBe('LIVE-0001')
    expect(payload.rows[0].document_no).not.toBe('FC-20250601001')
    expect(payload.totals.net_amount).toBe(1200)
    expect(payload.kpis.totalRevenue).toBe(1200)
  })
})
