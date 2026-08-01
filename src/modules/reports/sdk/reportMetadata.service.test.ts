import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadReportDefinition, runMetadataReport } from './reportMetadata.service'
import { supabase } from '../../../lib/supabase'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

const rpcMock = supabase.rpc as ReturnType<typeof vi.fn>

describe('reportMetadata.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws an explicit configuration error when the report definition is missing', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })

    await expect(
      loadReportDefinition('accounts', 'usali-departmental-statement', 'FRONT_OFFICE'),
    ).rejects.toMatchObject({
      code: 'REPORT_DEFINITION_MISSING',
      message: 'No report definition returned for accounts/usali-departmental-statement.',
    })
  })

  it('throws when the database definition identity does not match the route identity', async () => {
    rpcMock.mockResolvedValue({
      data: {
        report: {
          reportCode: 'RPT-999',
          title: 'Wrong Title',
          slug: 'wrong-slug',
          route: '/reports/accounts/wrong-slug',
        },
        fields: [{ fieldKey: 'amount', label: 'Amount', aggregation: 'SUM' }],
      },
      error: null,
    })

    await expect(
      loadReportDefinition('accounts', 'profit-and-loss-statement', 'FRONT_OFFICE'),
    ).rejects.toMatchObject({
      code: 'REPORT_IDENTITY_MISMATCH',
    })
  })

  it('throws an explicit error when tenant context is missing', async () => {
    await expect(
      runMetadataReport(
        'accounts',
        'profit-and-loss-statement',
        {
          start_date: '2026-07-01',
          end_date: '2026-07-31',
          compare_to: 'Off',
        },
        undefined,
      ),
    ).rejects.toMatchObject({
      code: 'REPORT_TENANT_MISSING',
      message: 'Missing tenant context.',
    })
  })

  it('does not silently ignore comparison execution failures', async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: {
          rows: [{ amount: 100 }],
          summary: {},
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'comparison rpc failed' },
      })

    await expect(
      runMetadataReport(
        'accounts',
        'profit-and-loss-statement',
        {
          start_date: '2026-07-01',
          end_date: '2026-07-31',
          compare_to: 'Previous Period',
        },
        'tenant-001',
      ),
    ).rejects.toMatchObject({
      code: 'REPORT_COMPARISON_FAILED',
      message: 'comparison rpc failed',
    })
  })
})
