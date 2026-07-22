import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as appSupabase } from '../../../lib/supabase.js'

export interface ItemWacResult {
  qty_on_hand: number
  avg_unit_cost: number
  inventory_value: number
}

function ensureClient(client?: SupabaseClient): SupabaseClient {
  const resolved = client ?? (appSupabase as unknown as SupabaseClient | null)
  if (!resolved) throw new Error('Supabase is not configured.')
  return resolved
}

function throwIfError(error: { message?: string } | null, fallback: string): void {
  if (!error) return
  throw new Error(error.message || fallback)
}

export class InventoryCostPolicyService {
  private readonly db: SupabaseClient

  constructor(client?: SupabaseClient) {
    this.db = ensureClient(client)
  }

  async getItemWac(tenantId: string, itemId: string, asOf?: string | null): Promise<ItemWacResult> {
    const { data, error } = await this.db.rpc('get_item_wac', {
      p_tenant_id: tenantId,
      p_item_id: itemId,
      p_as_of: asOf ?? null,
    })
    throwIfError(error, 'Failed to calculate item weighted-average cost.')

    const row = Array.isArray(data) ? data[0] : data
    return (row ?? {
      qty_on_hand: 0,
      avg_unit_cost: 0,
      inventory_value: 0,
    }) as ItemWacResult
  }

  async getItemWacNow(tenantId: string, itemId: string): Promise<ItemWacResult> {
    const { data, error } = await this.db.rpc('get_item_wac_now', {
      p_tenant_id: tenantId,
      p_item_id: itemId,
    })
    throwIfError(error, 'Failed to calculate current weighted-average cost.')

    const row = Array.isArray(data) ? data[0] : data
    return (row ?? {
      qty_on_hand: 0,
      avg_unit_cost: 0,
      inventory_value: 0,
    }) as ItemWacResult
  }
}

export const inventoryCostPolicyService = new InventoryCostPolicyService()
