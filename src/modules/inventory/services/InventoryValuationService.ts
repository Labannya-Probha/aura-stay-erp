import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as appSupabase } from '../../../lib/supabase.js'

export type InventoryValuationMethod = 'FIFO' | 'WEIGHTED_AVERAGE'

export interface InventoryIssueRequest {
  tenantId: string
  itemId: string
  warehouse: string
  qty: number
  referenceType: string
  referenceId?: string | null
  referenceLineId?: string | null
  postedBy?: string | null
  postToCogs?: boolean
  narration?: string | null
  postedAt?: string | null
  movementType?: 'OUTBOUND' | 'TRANSFER_OUT' | 'RETURN_TO_VENDOR' | 'ADJUSTMENT_OUT'
}

export interface InventoryReceiptRequest {
  tenantId: string
  itemId: string
  warehouse: string
  qty: number
  unitCost: number
  referenceType: string
  referenceId?: string | null
  referenceLineId?: string | null
  postedBy?: string | null
  postedAt?: string | null
  movementType?: 'INBOUND' | 'TRANSFER_IN' | 'RETURN_TO_STORE' | 'ADJUSTMENT_IN'
}

export interface InventoryCostResult {
  method: InventoryValuationMethod
  qty: number
  unit_cost: number
  total_cost: number
  balance_qty?: number
  balance_value?: number
  avg_unit_cost?: number
  journal_entry_id?: string | null
}

export interface InventoryAssetValueRow {
  item_id: string
  warehouse: string
  method: InventoryValuationMethod
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

export class InventoryValuationService {
  private readonly db: SupabaseClient

  constructor(client?: SupabaseClient) {
    this.db = ensureClient(client)
  }

  async previewIssueCost(
    tenantId: string,
    itemId: string,
    warehouse: string,
    qty: number,
  ): Promise<InventoryCostResult> {
    const { data, error } = await this.db.rpc('inventory_preview_issue_cost', {
      p_tenant_id: tenantId,
      p_item_id: itemId,
      p_warehouse: warehouse,
      p_qty: qty,
    })
    throwIfError(error, 'Failed to preview inventory issue cost.')
    return data as InventoryCostResult
  }

  async issueCost(request: InventoryIssueRequest): Promise<InventoryCostResult> {
    const { data, error } = await this.db.rpc('inventory_issue_cost', {
      p_tenant_id: request.tenantId,
      p_item_id: request.itemId,
      p_warehouse: request.warehouse,
      p_qty: request.qty,
      p_reference_type: request.referenceType,
      p_reference_id: request.referenceId ?? null,
      p_reference_line_id: request.referenceLineId ?? null,
      p_posted_by: request.postedBy ?? null,
      p_post_to_cogs: request.postToCogs ?? false,
      p_narration: request.narration ?? null,
      p_posted_at: request.postedAt ?? null,
      p_movement_type: request.movementType ?? 'OUTBOUND',
    })
    throwIfError(error, 'Failed to post inventory issue cost.')
    return data as InventoryCostResult
  }

  async receiveCost(request: InventoryReceiptRequest): Promise<InventoryCostResult> {
    const { data, error } = await this.db.rpc('inventory_receive_cost', {
      p_tenant_id: request.tenantId,
      p_item_id: request.itemId,
      p_warehouse: request.warehouse,
      p_qty: request.qty,
      p_unit_cost: request.unitCost,
      p_reference_type: request.referenceType,
      p_reference_id: request.referenceId ?? null,
      p_reference_line_id: request.referenceLineId ?? null,
      p_posted_by: request.postedBy ?? null,
      p_posted_at: request.postedAt ?? null,
      p_movement_type: request.movementType ?? 'INBOUND',
    })
    throwIfError(error, 'Failed to post inventory inbound cost.')
    return data as InventoryCostResult
  }

  async getAssetValuation(tenantId: string, warehouse?: string): Promise<InventoryAssetValueRow[]> {
    const { data, error } = await this.db.rpc('inventory_asset_valuation', {
      p_tenant_id: tenantId,
      p_warehouse: warehouse ?? null,
    })
    throwIfError(error, 'Failed to load inventory asset valuation.')
    return (data ?? []) as InventoryAssetValueRow[]
  }
}

export const inventoryValuationService = new InventoryValuationService()
