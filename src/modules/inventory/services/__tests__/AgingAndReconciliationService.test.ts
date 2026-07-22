import { describe, expect, it, vi } from 'vitest'
import { AgingAndReconciliationService } from '../AgingAndReconciliationService'

function mockClient() {
  return {
    rpc: vi.fn(),
    from: vi.fn(),
  }
}

describe('AgingAndReconciliationService', () => {
  it('calls get_aging_buckets with strict payload', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({ data: [], error: null })

    const service = new AgingAndReconciliationService(client as never)
    await service.getAgingBuckets('tenant-1', '2026-07-22', 'AP')

    expect(client.rpc).toHaveBeenCalledWith('get_aging_buckets', {
      p_tenant_id: 'tenant-1',
      p_as_of: '2026-07-22',
      p_ledger: 'AP',
    })
  })

  it('calls auto_match_bank_statement_line with default tolerance', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({ data: { status: 'matched' }, error: null })

    const service = new AgingAndReconciliationService(client as never)
    await service.autoMatchStatementLine('line-1', 'bot-user')

    expect(client.rpc).toHaveBeenCalledWith('auto_match_bank_statement_line', {
      p_statement_line_id: 'line-1',
      p_matched_by: 'bot-user',
      p_tolerance: 0.05,
    })
  })
})
