import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getTenantId: vi.fn(),
}))

const TENANT_ID = '22222222-2222-2222-2222-222222222222'

vi.mock('../../../lib/tenant', () => ({
  getTenantId: mocks.getTenantId,
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    rpc: (...args) => mocks.rpc(...args),
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: null,
        },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: null,
            error: {
              message: 'Not used in this test',
            },
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(async () => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  },
}))

const { loadAedsReportCatalog, loadAedsReportDefinition, runAedsReport } =
  await import('../reportEngine.service.js')

describe('reportEngine.service', () => {
  beforeEach(() => {
    mocks.rpc.mockReset()
    mocks.getTenantId.mockReset()
    mocks.getTenantId.mockReturnValue(TENANT_ID)
  })

  it('calls aeds_run_report with tenant-aware parameters', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        rows: [
          {
            id: 1,
            line_code: 'PL.REVENUE',
            label: 'Revenue',
            current_amount: 100000,
          },
        ],
        summary: {
          report: 'ifrs_profit_or_loss',
          tenant_id: TENANT_ID,
        },
      },
      error: null,
    })

    const result = await runAedsReport({
      department: 'accounts',
      slug: 'statement-of-profit-or-loss',
      filters: {
        start_date: '2026-07-01',
        end_date: '2026-07-31',
      },
    })

    expect(mocks.getTenantId).toHaveBeenCalledTimes(1)
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
    expect(mocks.rpc).toHaveBeenCalledWith('aeds_run_report', {
      p_department_slug: 'accounts',
      p_report_slug: 'statement-of-profit-or-loss',
      p_filters: {
        start_date: '2026-07-01',
        end_date: '2026-07-31',
      },
      p_tenant_id: TENANT_ID,
    })

    expect(result).toEqual({
      rows: [
        {
          id: 1,
          line_code: 'PL.REVENUE',
          label: 'Revenue',
          current_amount: 100000,
        },
      ],
      summary: {
        report: 'ifrs_profit_or_loss',
        tenant_id: TENANT_ID,
      },
    })
  })

  it('throws a visible report error when aeds_run_report fails', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: '42501',
        message: 'RPC unavailable',
        details: 'Permission denied',
        hint: 'Check RPC grants',
      },
    })

    await expect(
      runAedsReport({
        department: 'accounts',
        slug: 'ledger',
        filters: {},
      }),
    ).rejects.toMatchObject({
      code: '42501',
      message: 'RPC unavailable',
      details: 'Permission denied',
      hint: 'Check RPC grants',
    })

    expect(mocks.rpc).toHaveBeenCalledWith('aeds_run_report', {
      p_department_slug: 'accounts',
      p_report_slug: 'ledger',
      p_filters: {},
      p_tenant_id: TENANT_ID,
    })
  })

  it('throws when report engine returns summary.error', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        rows: [],
        summary: {
          error: 'unknown report',
        },
      },
      error: null,
    })

    await expect(
      runAedsReport({
        department: 'accounts',
        slug: 'unknown-report',
        filters: {},
      }),
    ).rejects.toMatchObject({
      code: 'REPORT_ENGINE_ERROR',
      message: 'unknown report',
    })
  })

  it('throws before RPC call when tenant context is missing', async () => {
    mocks.getTenantId.mockReturnValue(null)

    await expect(
      runAedsReport({
        department: 'accounts',
        slug: 'ledger',
        filters: {},
      }),
    ).rejects.toMatchObject({
      code: 'TENANT_CONTEXT_MISSING',
      message: 'Tenant context is missing. Sign out and sign in again before running reports.',
    })

    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('normalizes null rows and summary to safe defaults', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        rows: null,
        summary: null,
      },
      error: null,
    })

    const result = await runAedsReport({
      department: 'accounts',
      slug: 'ledger',
      filters: {},
    })

    expect(result).toEqual({
      rows: [],
      summary: {},
    })
  })

  it('loads report catalog using metadata RPC', async () => {
    const catalogPayload = [
      {
        department: {
          slug: 'accounts',
          name: 'Accounts',
        },
        reports: [],
      },
    ]

    mocks.rpc.mockResolvedValue({
      data: catalogPayload,
      error: null,
    })

    const result = await loadAedsReportCatalog('ADMIN')

    expect(mocks.rpc).toHaveBeenCalledWith('aeds_report_metadata', {
      p_role: 'ADMIN',
    })

    expect(result).toEqual(catalogPayload)
  })

  it('loads report definition using definition RPC', async () => {
    const definitionPayload = {
      department: {
        slug: 'accounts',
        name: 'Accounts',
      },
      report: {
        reportCode: 'RPT-IFRS-PNL',
        title: 'Statement of Profit or Loss',
        slug: 'statement-of-profit-or-loss',
      },
      fields: [],
      filters: [],
      actions: [],
    }

    mocks.rpc.mockResolvedValue({
      data: definitionPayload,
      error: null,
    })

    const result = await loadAedsReportDefinition({
      department: 'accounts',
      slug: 'statement-of-profit-or-loss',
      role: 'ADMIN',
    })

    expect(mocks.rpc).toHaveBeenCalledWith('aeds_report_definition', {
      p_department_slug: 'accounts',
      p_report_slug: 'statement-of-profit-or-loss',
      p_role: 'ADMIN',
    })

    expect(result).toEqual(definitionPayload)
  })

  it('throws when report definition is unavailable', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: null,
    })

    await expect(
      loadAedsReportDefinition({
        department: 'accounts',
        slug: 'restricted-report',
        role: 'FRONT_OFFICE',
      }),
    ).rejects.toMatchObject({
      code: 'REPORT_ACCESS_DENIED',
      message: 'This report is unavailable or your role does not have access.',
    })
  })
})
