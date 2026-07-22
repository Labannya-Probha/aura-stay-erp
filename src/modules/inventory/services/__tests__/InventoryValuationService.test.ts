import { describe, expect, it, vi } from 'vitest'
import { InventoryValuationService } from '../InventoryValuationService'

function mockClient() {
  return {
    rpc: vi.fn(),
  }
}

describe('InventoryValuationService', () => {
  it('calls inventory_issue_cost with strict payload mapping', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({
      data: {
        method: 'FIFO',
        qty: 3,
        unit_cost: 120,
        total_cost: 360,
        balance_qty: 7,
        balance_value: 840,
        journal_entry_id: 'jv-1',
      },
      error: null,
    })

    const service = new InventoryValuationService(client as never)
    const result = await service.issueCost({
      tenantId: 'tenant-1',
      itemId: 'item-1',
      warehouse: 'KITCHEN',
      qty: 3,
      referenceType: 'CONSUMPTION',
      referenceId: 'header-1',
      referenceLineId: 'line-1',
      postToCogs: true,
      postedBy: 'qa',
      narration: 'Consumption ENT-001',
      movementType: 'OUTBOUND',
    })

    expect(client.rpc).toHaveBeenCalledWith('inventory_issue_cost', {
      p_tenant_id: 'tenant-1',
      p_item_id: 'item-1',
      p_warehouse: 'KITCHEN',
      p_qty: 3,
      p_reference_type: 'CONSUMPTION',
      p_reference_id: 'header-1',
      p_reference_line_id: 'line-1',
      p_posted_by: 'qa',
      p_post_to_cogs: true,
      p_narration: 'Consumption ENT-001',
      p_posted_at: null,
      p_movement_type: 'OUTBOUND',
    })
    expect(result.total_cost).toBe(360)
    expect(result.journal_entry_id).toBe('jv-1')
  })

  it('surfaces RPC errors clearly', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({ data: null, error: { message: 'Insufficient stock' } })

    const service = new InventoryValuationService(client as never)

    await expect(service.previewIssueCost('tenant-1', 'item-1', 'STORE', 999)).rejects.toThrow(
      'Insufficient stock',
    )
  })

  it('reads inventory_asset_valuation rows', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({
      data: [
        {
          item_id: 'item-1',
          warehouse: 'STORE',
          method: 'WEIGHTED_AVERAGE',
          qty_on_hand: 10,
          avg_unit_cost: 95,
          inventory_value: 950,
        },
      ],
      error: null,
    })

    const service = new InventoryValuationService(client as never)
    const rows = await service.getAssetValuation('tenant-1')

    expect(client.rpc).toHaveBeenCalledWith('inventory_asset_valuation', {
      p_tenant_id: 'tenant-1',
      p_warehouse: null,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.inventory_value).toBe(950)
  })
})
