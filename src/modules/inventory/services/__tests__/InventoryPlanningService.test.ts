import { describe, expect, it, vi } from 'vitest'
import { InventoryPlanningService } from '../InventoryPlanningService'

function mockClient() {
  return {
    rpc: vi.fn(),
  }
}

describe('InventoryPlanningService', () => {
  it('maps FEFO consume payload correctly', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({
      data: {
        physical_cost: 99,
        valuation_result: { total_cost: 99 },
      },
      error: null,
    })

    const service = new InventoryPlanningService(client as never)
    const out = await service.consumeFefo({
      tenantId: 'tenant-1',
      itemId: 'item-1',
      warehouse: 'STORE',
      qty: 2,
      referenceType: 'CONSUMPTION',
      referenceId: 'ref-1',
      referenceLineId: 'line-1',
      postedBy: 'qa',
      postToCogs: true,
    })

    expect(client.rpc).toHaveBeenCalledWith('consume_inventory_fefo', {
      p_tenant_id: 'tenant-1',
      p_item_id: 'item-1',
      p_warehouse: 'STORE',
      p_qty: 2,
      p_reference_type: 'CONSUMPTION',
      p_reference_id: 'ref-1',
      p_reference_line_id: 'line-1',
      p_posted_by: 'qa',
      p_post_to_cogs: true,
    })
    expect(out.physical_cost).toBe(99)
  })

  it('maps reorder generation payload', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({ data: 4, error: null })

    const service = new InventoryPlanningService(client as never)
    const count = await service.generateReorderRequisitions('tenant-2')

    expect(client.rpc).toHaveBeenCalledWith('generate_reorder_requisitions', {
      p_tenant_id: 'tenant-2',
    })
    expect(count).toBe(4)
  })
})
