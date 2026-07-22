import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, describe, expect, it } from 'vitest'

type UUID = string

interface IntegrationContext {
  db: SupabaseClient
  tenantId: UUID
  itemId: UUID
  itemName: string
  vendorId: UUID
  warehouse: string
  createdBy: string
}

const SUPABASE_URL = process.env.INTEGRATION_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.INTEGRATION_SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = process.env.INTEGRATION_TENANT_ID ?? null
const RUN_INTEGRATION = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)

const createdIds: Record<string, UUID[]> = {
  transfer_items: [],
  stock_transfers: [],
  consumption_lines: [],
  consumption_entries: [],
  grn_items: [],
  goods_receipts: [],
}

function createDb(): SupabaseClient {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Integration credentials are missing.')
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

function must<T>(value: T | null | undefined, msg: string): T {
  if (value === null || value === undefined) throw new Error(msg)
  return value
}

async function resolveContext(db: SupabaseClient): Promise<IntegrationContext> {
  const tenantId =
    TENANT_ID ??
    must(
      (await db.from('company_settings').select('tenant_id').limit(1).single()).data?.tenant_id,
      'No tenant found',
    )

  const { data: profile } = await db
    .from('inventory_accounting_profiles')
    .select('warehouse')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const warehouse = profile?.warehouse || 'STORE'

  const { data: vendor } = await db
    .from('vendors')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .limit(1)
    .single()

  const { data: item } = await db
    .from('inv_items')
    .select('id,name')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .limit(1)
    .single()

  return {
    db,
    tenantId,
    vendorId: must(vendor?.id, 'No active vendor available for integration test.'),
    itemId: must(item?.id, 'No active inventory item available for integration test.'),
    itemName: item?.name || 'Integration Item',
    warehouse,
    createdBy: 'inventory-integration-test',
  }
}

async function cleanup(db: SupabaseClient): Promise<void> {
  // Reverse delete order to satisfy FK constraints.
  for (const [table, ids] of [
    ['transfer_items', createdIds.transfer_items],
    ['stock_transfers', createdIds.stock_transfers],
    ['consumption_lines', createdIds.consumption_lines],
    ['consumption_entries', createdIds.consumption_entries],
    ['grn_items', createdIds.grn_items],
    ['goods_receipts', createdIds.goods_receipts],
  ] as const) {
    if (!ids.length) continue
    await db.from(table).delete().in('id', ids)
  }
}

const suite = RUN_INTEGRATION ? describe : describe.skip

suite('Inventory valuation integration path', () => {
  const db = RUN_INTEGRATION ? createDb() : (null as unknown as SupabaseClient)

  afterAll(async () => {
    if (!RUN_INTEGRATION) return
    await cleanup(db)
  })

  it('creates GRN, consumption, transfer and verifies valuation + journal side effects', async () => {
    const ctx = await resolveContext(db)

    const { data: grn, error: grnErr } = await db
      .from('goods_receipts')
      .insert({
        tenant_id: ctx.tenantId,
        vendor_id: ctx.vendorId,
        warehouse: ctx.warehouse,
        vendor_invoice_no: `INT-${Date.now()}`,
        vendor_invoice_date: new Date().toISOString().slice(0, 10),
        rebateable: true,
        created_by: ctx.createdBy,
      })
      .select('id,grn_no')
      .single()
    if (grnErr) throw grnErr
    createdIds.goods_receipts.push(must(grn?.id, 'GRN insert failed'))

    const { data: grnLine, error: grnLineErr } = await db
      .from('grn_items')
      .insert({
        grn_id: grn.id,
        item_id: ctx.itemId,
        item_name: ctx.itemName,
        qty: 10,
        unit_cost: 100,
        vat_amount: 0,
      })
      .select('id')
      .single()
    if (grnLineErr) throw grnLineErr
    createdIds.grn_items.push(must(grnLine?.id, 'GRN line insert failed'))

    const { data: consumption, error: consErr } = await db
      .from('consumption_entries')
      .insert({
        tenant_id: ctx.tenantId,
        entry_date: new Date().toISOString().slice(0, 10),
        location: ctx.warehouse,
        reason: 'INTERNAL_USE',
        reference: grn.grn_no,
        created_by: ctx.createdBy,
      })
      .select('id,entry_no')
      .single()
    if (consErr) throw consErr
    createdIds.consumption_entries.push(must(consumption?.id, 'Consumption entry insert failed'))

    const { data: consumptionLine, error: consLineErr } = await db
      .from('consumption_lines')
      .insert({
        consumption_id: consumption.id,
        item_id: ctx.itemId,
        item_name: ctx.itemName,
        qty: 3,
      })
      .select('id,line_cost,unit_cost')
      .single()
    if (consLineErr) throw consLineErr
    createdIds.consumption_lines.push(must(consumptionLine?.id, 'Consumption line insert failed'))

    expect(Number(consumptionLine?.line_cost || 0)).toBeGreaterThan(0)

    const { data: transfer, error: transferErr } = await db
      .from('stock_transfers')
      .insert({
        tenant_id: ctx.tenantId,
        from_location: ctx.warehouse,
        to_location: 'KITCHEN',
        transfer_date: new Date().toISOString().slice(0, 10),
        created_by: ctx.createdBy,
      })
      .select('id')
      .single()
    if (transferErr) throw transferErr
    createdIds.stock_transfers.push(must(transfer?.id, 'Transfer insert failed'))

    const { data: transferLine, error: transferLineErr } = await db
      .from('transfer_items')
      .insert({
        transfer_id: transfer.id,
        item_id: ctx.itemId,
        item_name: ctx.itemName,
        qty: 2,
      })
      .select('id')
      .single()
    if (transferLineErr) throw transferLineErr
    createdIds.transfer_items.push(must(transferLine?.id, 'Transfer line insert failed'))

    const { data: valuationRows, error: valuationErr } = await db
      .from('inventory_valuation_ledger')
      .select(
        'id,movement_type,reference_type,reference_id,reference_line_id,journal_entry_id,total_cost',
      )
      .eq('tenant_id', ctx.tenantId)
      .in('reference_type', ['GRN', 'CONSUMPTION', 'TRANSFER'])
      .or(
        `reference_id.eq.${grn.id},reference_id.eq.${consumption.id},reference_id.eq.${transfer.id}`,
      )

    if (valuationErr) throw valuationErr
    expect((valuationRows || []).length).toBeGreaterThanOrEqual(4)

    const cogsMovement = (valuationRows || []).find(
      (row) => row.reference_line_id === consumptionLine.id,
    )
    expect(cogsMovement).toBeTruthy()
    expect(cogsMovement?.journal_entry_id).toBeTruthy()

    const { data: journalLines, error: jErr } = await db
      .from('journal_lines')
      .select('debit,credit')
      .eq('entry_id', cogsMovement?.journal_entry_id)

    if (jErr) throw jErr

    const totalDebit = (journalLines || []).reduce((sum, line) => sum + Number(line.debit || 0), 0)
    const totalCredit = (journalLines || []).reduce(
      (sum, line) => sum + Number(line.credit || 0),
      0,
    )
    expect(totalDebit).toBeGreaterThan(0)
    expect(Number(totalDebit.toFixed(2))).toBe(Number(totalCredit.toFixed(2)))
  })
})
