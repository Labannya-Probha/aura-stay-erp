import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as appSupabase } from '../../../lib/supabase.js'

export interface FefoConsumeRequest {
  tenantId: string
  itemId: string
  warehouse: string
  qty: number
  referenceType: string
  referenceId?: string | null
  referenceLineId?: string | null
  postedBy?: string | null
  postToCogs?: boolean
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

export class InventoryPlanningService {
  private readonly db: SupabaseClient

  constructor(client?: SupabaseClient) {
    this.db = ensureClient(client)
  }

  async allocateLandedCost(
    grnId: string,
    totalLandedCost: number,
    method: 'QTY' | 'VALUE' | 'WEIGHT' | 'MANUAL' = 'VALUE',
    createdBy?: string | null,
  ): Promise<number> {
    const { data, error } = await this.db.rpc('allocate_landed_cost_to_grn', {
      p_grn_id: grnId,
      p_total_landed_cost: totalLandedCost,
      p_method: method,
      p_created_by: createdBy ?? null,
    })
    throwIfError(error, 'Failed to allocate landed cost.')
    return Number(data ?? 0)
  }

  async consumeFefo(request: FefoConsumeRequest): Promise<{
    physical_cost: number
    valuation_result: unknown
  }> {
    const { data, error } = await this.db.rpc('consume_inventory_fefo', {
      p_tenant_id: request.tenantId,
      p_item_id: request.itemId,
      p_warehouse: request.warehouse,
      p_qty: request.qty,
      p_reference_type: request.referenceType,
      p_reference_id: request.referenceId ?? null,
      p_reference_line_id: request.referenceLineId ?? null,
      p_posted_by: request.postedBy ?? null,
      p_post_to_cogs: request.postToCogs ?? true,
    })
    throwIfError(error, 'Failed to consume inventory via FEFO.')
    return data as { physical_cost: number; valuation_result: unknown }
  }

  async generateReorderRequisitions(tenantId?: string | null): Promise<number> {
    const { data, error } = await this.db.rpc('generate_reorder_requisitions', {
      p_tenant_id: tenantId ?? null,
    })
    throwIfError(error, 'Failed to generate reorder requisitions.')
    return Number(data ?? 0)
  }
}

export const inventoryPlanningService = new InventoryPlanningService()
