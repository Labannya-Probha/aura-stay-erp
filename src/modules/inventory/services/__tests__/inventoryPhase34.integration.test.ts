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
  bankAccountId: UUID
  balancingAccountId: UUID
  createdBy: string
}

const SUPABASE_URL = process.env.INTEGRATION_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.INTEGRATION_SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = process.env.INTEGRATION_TENANT_ID ?? null
const RUN_INTEGRATION = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)

const createdIds: Record<string, UUID[]> = {
  bank_reconciliation_matches: [],
  bank_statement_lines: [],
  reconciliation_sessions: [],
  journal_lines: [],
  journal_entries: [],
  landed_cost_allocations: [],
  inventory_lot_movements: [],
  inventory_lots: [],
  requisition_items: [],
  requisitions: [],
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

  const { data: accounts, error: accountErr } = await db
    .from('chart_of_accounts')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(2)

  if (accountErr) throw accountErr
  if (!accounts || accounts.length < 2) {
    throw new Error('Need at least two chart_of_accounts rows for reconciliation integration test.')
  }

  return {
    db,
    tenantId,
    itemId: must(item?.id, 'No active inventory item available for integration test.'),
    itemName: item?.name || 'Integration Item',
    vendorId: must(vendor?.id, 'No active vendor available for integration test.'),
    warehouse,
    bankAccountId: accounts[0]!.id,
    balancingAccountId: accounts[1]!.id,
    createdBy: 'inventory-phase34-integration-test',
  }
}

async function cleanup(db: SupabaseClient): Promise<void> {
  for (const [table, ids] of [
    ['bank_reconciliation_matches', createdIds.bank_reconciliation_matches],
    ['bank_statement_lines', createdIds.bank_statement_lines],
    ['reconciliation_sessions', createdIds.reconciliation_sessions],
    ['journal_lines', createdIds.journal_lines],
    ['journal_entries', createdIds.journal_entries],
    ['landed_cost_allocations', createdIds.landed_cost_allocations],
    ['inventory_lot_movements', createdIds.inventory_lot_movements],
    ['inventory_lots', createdIds.inventory_lots],
    ['requisition_items', createdIds.requisition_items],
    ['requisitions', createdIds.requisitions],
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

suite('Phase 3/4 integration workflows', () => {
  const db = RUN_INTEGRATION ? createDb() : (null as unknown as SupabaseClient)

  afterAll(async () => {
    if (!RUN_INTEGRATION) return
    await cleanup(db)
  })

  it('returns aging buckets for AP/AR views', async () => {
    const ctx = await resolveContext(db)

    const { data, error } = await db.rpc('get_aging_buckets', {
      p_tenant_id: ctx.tenantId,
      p_as_of: new Date().toISOString().slice(0, 10),
      p_ledger: 'ALL',
    })

    if (error) throw error
    expect(Array.isArray(data)).toBe(true)

    if ((data || []).length > 0) {
      expect(data[0]).toHaveProperty('bucket_0_30')
      expect(data[0]).toHaveProperty('bucket_91_plus')
    }
  })

  it('auto-matches statement lines against journal lines', async () => {
    const ctx = await resolveContext(db)

    const { data: entry, error: entryErr } = await db
      .from('journal_entries')
      .insert({
        tenant_id: ctx.tenantId,
        jv_date: new Date().toISOString().slice(0, 10),
        narration: 'Integration bank reconciliation source entry',
        created_by: ctx.createdBy,
      })
      .select('id')
      .single()
    if (entryErr) throw entryErr
    createdIds.journal_entries.push(must(entry?.id, 'Journal entry insert failed'))

    const { data: lines, error: lineErr } = await db
      .from('journal_lines')
      .insert([
        {
          entry_id: entry.id,
          account_id: ctx.bankAccountId,
          debit: 120,
          credit: 0,
          line_note: 'BANKREF-INT-001',
        },
        {
          entry_id: entry.id,
          account_id: ctx.balancingAccountId,
          debit: 0,
          credit: 120,
          line_note: 'Balance leg',
        },
      ])
      .select('id')
    if (lineErr) throw lineErr
    for (const row of lines || []) createdIds.journal_lines.push(row.id)

    const { data: session, error: sessionErr } = await db
      .from('reconciliation_sessions')
      .insert({
        tenant_id: ctx.tenantId,
        bank_account_id: ctx.bankAccountId,
        statement_start_date: new Date().toISOString().slice(0, 10),
        statement_end_date: new Date().toISOString().slice(0, 10),
        opened_by: ctx.createdBy,
        notes: 'integration session',
      })
      .select('id')
      .single()
    if (sessionErr) throw sessionErr
    createdIds.reconciliation_sessions.push(
      must(session?.id, 'Reconciliation session insert failed'),
    )

    const { data: statementLine, error: stmtErr } = await db
      .from('bank_statement_lines')
      .insert({
        session_id: session.id,
        tenant_id: ctx.tenantId,
        txn_date: new Date().toISOString().slice(0, 10),
        reference: 'BANKREF-INT-001',
        description: 'Integration bank line',
        debit: 120,
        credit: 0,
      })
      .select('id,match_status')
      .single()
    if (stmtErr) throw stmtErr
    createdIds.bank_statement_lines.push(must(statementLine?.id, 'Statement line insert failed'))

    const { data: matchResult, error: matchErr } = await db.rpc('auto_match_bank_statement_line', {
      p_statement_line_id: statementLine.id,
      p_matched_by: ctx.createdBy,
      p_tolerance: 0.05,
    })
    if (matchErr) throw matchErr

    expect(['matched', 'already_matched']).toContain(matchResult?.status)

    const { data: refreshed, error: refreshErr } = await db
      .from('bank_statement_lines')
      .select('match_status')
      .eq('id', statementLine.id)
      .single()
    if (refreshErr) throw refreshErr
    expect(refreshed?.match_status).toBe('MATCHED')

    const { data: createdMatchRows, error: matchRowsErr } = await db
      .from('bank_reconciliation_matches')
      .select('id')
      .eq('statement_line_id', statementLine.id)
    if (matchRowsErr) throw matchRowsErr
    for (const row of createdMatchRows || []) createdIds.bank_reconciliation_matches.push(row.id)
  })

  it('allocates landed cost and consumes FEFO lots', async () => {
    const ctx = await resolveContext(db)

    const { data: grn, error: grnErr } = await db
      .from('goods_receipts')
      .insert({
        tenant_id: ctx.tenantId,
        vendor_id: ctx.vendorId,
        warehouse: ctx.warehouse,
        vendor_invoice_no: `PH34-${Date.now()}`,
        vendor_invoice_date: new Date().toISOString().slice(0, 10),
        rebateable: true,
        created_by: ctx.createdBy,
      })
      .select('id,grn_no')
      .single()
    if (grnErr) throw grnErr
    createdIds.goods_receipts.push(must(grn?.id, 'GRN insert failed'))

    const { data: grnItem, error: grnItemErr } = await db
      .from('grn_items')
      .insert({
        grn_id: grn.id,
        item_id: ctx.itemId,
        item_name: ctx.itemName,
        qty: 6,
        unit_cost: 50,
        vat_amount: 0,
      })
      .select('id')
      .single()
    if (grnItemErr) throw grnItemErr
    createdIds.grn_items.push(must(grnItem?.id, 'GRN item insert failed'))

    const { data: lot, error: lotErr } = await db
      .from('inventory_lots')
      .select('id,remaining_qty')
      .eq('grn_item_id', grnItem.id)
      .limit(1)
      .maybeSingle()
    if (lotErr) throw lotErr
    expect(lot?.id).toBeTruthy()
    if (lot?.id) createdIds.inventory_lots.push(lot.id)

    const { data: allocCount, error: allocErr } = await db.rpc('allocate_landed_cost_to_grn', {
      p_grn_id: grn.id,
      p_total_landed_cost: 12,
      p_method: 'VALUE',
      p_created_by: ctx.createdBy,
    })
    if (allocErr) throw allocErr
    expect(Number(allocCount || 0)).toBeGreaterThan(0)

    const { data: allocRows, error: allocRowsErr } = await db
      .from('landed_cost_allocations')
      .select('id')
      .eq('grn_id', grn.id)
    if (allocRowsErr) throw allocRowsErr
    for (const row of allocRows || []) createdIds.landed_cost_allocations.push(row.id)

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
      .select('id')
      .single()
    if (consErr) throw consErr
    createdIds.consumption_entries.push(must(consumption?.id, 'Consumption entry insert failed'))

    const { data: line, error: lineErr } = await db
      .from('consumption_lines')
      .insert({
        consumption_id: consumption.id,
        item_id: ctx.itemId,
        item_name: ctx.itemName,
        qty: 2,
      })
      .select('id')
      .single()
    if (lineErr) throw lineErr
    createdIds.consumption_lines.push(must(line?.id, 'Consumption line insert failed'))

    const { data: fefoResult, error: fefoErr } = await db.rpc('consume_inventory_fefo', {
      p_tenant_id: ctx.tenantId,
      p_item_id: ctx.itemId,
      p_warehouse: ctx.warehouse,
      p_qty: 2,
      p_reference_type: 'CONSUMPTION',
      p_reference_id: consumption.id,
      p_reference_line_id: line.id,
      p_posted_by: ctx.createdBy,
      p_post_to_cogs: true,
    })
    if (fefoErr) throw fefoErr

    expect(Number(fefoResult?.physical_cost || 0)).toBeGreaterThan(0)

    const { data: lotMoves, error: moveErr } = await db
      .from('inventory_lot_movements')
      .select('id')
      .eq('reference_line_id', line.id)
      .eq('movement_type', 'ISSUE')
    if (moveErr) throw moveErr
    expect((lotMoves || []).length).toBeGreaterThan(0)
    for (const row of lotMoves || []) createdIds.inventory_lot_movements.push(row.id)
  })

  it('executes auto-reorder generation path', async () => {
    const ctx = await resolveContext(db)

    const { data: beforeReqItems, error: beforeReqErr } = await db
      .from('requisition_items')
      .select('id,requisition_id,requisitions!inner(id,tenant_id,requested_by,req_date)')
      .eq('item_id', ctx.itemId)
      .eq('requisitions.tenant_id', ctx.tenantId)
      .eq('requisitions.requested_by', 'SYSTEM_AUTO_REORDER')
      .eq('requisitions.req_date', new Date().toISOString().slice(0, 10))
    if (beforeReqErr) throw beforeReqErr

    const beforeIds = new Set((beforeReqItems || []).map((r) => r.id))
    const beforeReqParentIds = new Set((beforeReqItems || []).map((r: any) => r.requisitions?.id))

    const { error: tuneErr } = await db
      .from('inv_items')
      .update({ auto_reorder_enabled: true, reorder_point: 999999, reorder_qty: 5 })
      .eq('id', ctx.itemId)
      .eq('tenant_id', ctx.tenantId)
    if (tuneErr) throw tuneErr

    const { data: generatedCount, error: genErr } = await db.rpc('generate_reorder_requisitions', {
      p_tenant_id: ctx.tenantId,
    })
    if (genErr) throw genErr

    expect(Number(generatedCount || 0)).toBeGreaterThanOrEqual(0)

    const { data: afterReqItems, error: afterReqErr } = await db
      .from('requisition_items')
      .select('id,requisition_id,requisitions!inner(id,tenant_id,requested_by,req_date)')
      .eq('item_id', ctx.itemId)
      .eq('requisitions.tenant_id', ctx.tenantId)
      .eq('requisitions.requested_by', 'SYSTEM_AUTO_REORDER')
      .eq('requisitions.req_date', new Date().toISOString().slice(0, 10))
    if (afterReqErr) throw afterReqErr

    for (const row of afterReqItems || []) {
      if (!beforeIds.has(row.id)) createdIds.requisition_items.push(row.id)
      const reqId = (row as any).requisitions?.id
      if (reqId && !beforeReqParentIds.has(reqId)) createdIds.requisitions.push(reqId)
    }

    expect((afterReqItems || []).length).toBeGreaterThanOrEqual((beforeReqItems || []).length)
  })
})
