import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.fn()

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    rpc: (...args) => rpcMock(...args),
    auth: {
      getSession: async () => ({ data: { session: null } }),
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: 'not used' } }),
        }),
      }),
      select: () => ({
        eq: () => [],
      }),
    }),
  },
}))

vi.mock('../../../lib/tenant', () => ({
  getTenantId: () => 'tenant-123',
}))

const { loadAedsReportCatalog, loadAedsReportDefinition, runAedsReport } =
  await import('../reportEngine.service.js')

describe('reportEngine.service', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('calls aeds_run_report with the expected parameter shape', async () => {
    rpcMock.mockResolvedValue({
      data: { rows: [{ id: 1 }], summary: { report: 'ifrs_profit_or_loss' } },
      error: null,
    })

    const result = await runAedsReport({
      department: 'accounts',
      slug: 'statement-of-profit-or-loss',
      filters: { start_date: '2026-07-01', end_date: '2026-07-31' },
    })

    expect(rpcMock).toHaveBeenCalledWith('aeds_run_report', {
      p_department_slug: 'accounts',
      p_report_slug: 'statement-of-profit-or-loss',
      p_filters: {
        start_date: '2026-07-01',
        end_date: '2026-07-31',
      },
      p_tenant_id: 'tenant-123',
    })
    expect(result.summary.report).toBe('ifrs_profit_or_loss')
  })

  it('throws when aeds_run_report fails', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'RPC unavailable' } })

    await expect(runAedsReport({ department: 'accounts', slug: 'ledger' })).rejects.toMatchObject({
      message: 'RPC unavailable',
      code: 'REPORT_REQUEST_FAILED',
    })
  })

  it('uses aeds_report_metadata and aeds_report_definition RPCs for catalog and definition', async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: [{ department: { slug: 'accounts' }, reports: [] }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: { report: { reportCode: 'RPT-IFRS-PNL', title: 'Statement of Profit or Loss' } },
        error: null,
      })

    const catalog = await loadAedsReportCatalog('ADMIN')
    const definition = await loadAedsReportDefinition({
      department: 'accounts',
      slug: 'statement-of-profit-or-loss',
      role: 'ADMIN',
    })

    expect(rpcMock).toHaveBeenNthCalledWith(1, 'aeds_report_metadata', { p_role: 'ADMIN' })
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'aeds_report_definition', {
      p_department_slug: 'accounts',
      p_report_slug: 'statement-of-profit-or-loss',
      p_role: 'ADMIN',
    })
    expect(catalog).toEqual([{ department: { slug: 'accounts' }, reports: [] }])
    expect(definition.report.reportCode).toBe('RPT-IFRS-PNL')
  })
})
