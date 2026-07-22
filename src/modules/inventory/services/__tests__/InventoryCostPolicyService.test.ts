import { describe, expect, it, vi } from 'vitest'
import { InventoryCostPolicyService } from '../InventoryCostPolicyService'

function mockClient() {
  return {
    rpc: vi.fn(),
  }
}

describe('InventoryCostPolicyService', () => {
  it('calls get_item_wac_now with correct payload', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({
      data: { qty_on_hand: 10, avg_unit_cost: 12.5, inventory_value: 125 },
      error: null,
    })

    const service = new InventoryCostPolicyService(client as never)
    const out = await service.getItemWacNow('tenant-1', 'item-1')

    expect(client.rpc).toHaveBeenCalledWith('get_item_wac_now', {
      p_tenant_id: 'tenant-1',
      p_item_id: 'item-1',
    })
    expect(out.inventory_value).toBe(125)
  })

  it('surfaces rpc errors', async () => {
    const client = mockClient()
    client.rpc.mockResolvedValue({ data: null, error: { message: 'bad request' } })

    const service = new InventoryCostPolicyService(client as never)
    await expect(service.getItemWac('tenant-1', 'item-1')).rejects.toThrow('bad request')
  })
})
