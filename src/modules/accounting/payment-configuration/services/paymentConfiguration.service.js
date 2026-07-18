import { supabase } from '../../../../lib/supabase.js'

const TERMINALS_TABLE = 'payment_terminals'
const COA_TABLE = 'chart_of_accounts'

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
}

function requireTenantId(tenantId) {
  if (!tenantId) {
    throw new Error('A valid tenant ID is required for payment configuration.')
  }
}

function normalizeTerminal(row) {
  const settlementAccount = row?.settlement_account ?? null

  return {
    ...row,
    name: row?.name ?? row?.terminal_name ?? '',
    code: row?.code ?? row?.terminal_code ?? '',
    settlement_account_name: settlementAccount?.account_name ?? '',
    settlement_account_code: settlementAccount?.account_code ?? '',
  }
}

function sanitizeTerminalPayload(payload = {}) {
  const clean = {
    terminal_name: payload.terminal_name ?? payload.name,
    terminal_code: payload.terminal_code ?? payload.code,
    payment_method: payload.payment_method,
    provider: payload.provider,
    merchant_id: payload.merchant_id || null,
    terminal_id: payload.terminal_id || null,
    settlement_account_id: payload.settlement_account_id || null,
    is_active: payload.is_active ?? true,
  }

  return Object.fromEntries(
    Object.entries(clean).filter(([, value]) => value !== undefined),
  )
}

function throwSupabaseError(error, fallbackMessage) {
  if (!error) return

  if (error.code === '23505') {
    throw new Error('A payment terminal with the same code or identifying information already exists.')
  }

  throw new Error(error.message || fallbackMessage)
}

const paymentConfigurationService = {
  async listTerminals(tenantId) {
    requireSupabase()
    requireTenantId(tenantId)

    const { data, error } = await supabase
      .from(TERMINALS_TABLE)
      .select(`
        id,
        tenant_id,
        terminal_name,
        terminal_code,
        payment_method,
        provider,
        merchant_id,
        terminal_id,
        settlement_account_id,
        is_active,
        created_at,
        updated_at,
        settlement_account:${COA_TABLE}!payment_terminals_settlement_account_id_fkey(
          id,
          account_code,
          account_name
        )
      `)
      .eq('tenant_id', tenantId)
      .order('is_active', { ascending: false })
      .order('terminal_name', { ascending: true })

    throwSupabaseError(error, 'Unable to load payment terminals.')
    return (data ?? []).map(normalizeTerminal)
  },

  async createTerminal(tenantId, payload) {
    requireSupabase()
    requireTenantId(tenantId)

    const terminalPayload = {
      ...sanitizeTerminalPayload(payload),
      tenant_id: tenantId,
    }

    const { data, error } = await supabase
      .from(TERMINALS_TABLE)
      .insert(terminalPayload)
      .select(`
        *,
        settlement_account:${COA_TABLE}!payment_terminals_settlement_account_id_fkey(
          id,
          account_code,
          account_name
        )
      `)
      .single()

    throwSupabaseError(error, 'Unable to create the payment terminal.')
    return normalizeTerminal(data)
  },

  async updateTerminal(tenantId, terminalId, payload) {
    requireSupabase()
    requireTenantId(tenantId)

    if (!terminalId) {
      throw new Error('A payment terminal ID is required.')
    }

    const terminalPayload = sanitizeTerminalPayload(payload)

    const { data, error } = await supabase
      .from(TERMINALS_TABLE)
      .update(terminalPayload)
      .eq('tenant_id', tenantId)
      .eq('id', terminalId)
      .select(`
        *,
        settlement_account:${COA_TABLE}!payment_terminals_settlement_account_id_fkey(
          id,
          account_code,
          account_name
        )
      `)
      .single()

    throwSupabaseError(error, 'Unable to update the payment terminal.')
    return normalizeTerminal(data)
  },

  async removeTerminal(tenantId, terminalId) {
    requireSupabase()
    requireTenantId(tenantId)

    if (!terminalId) {
      throw new Error('A payment terminal ID is required.')
    }

    const { error } = await supabase
      .from(TERMINALS_TABLE)
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', terminalId)

    throwSupabaseError(error, 'Unable to remove the payment terminal.')
    return terminalId
  },

  async listSettlementAccounts(tenantId) {
    requireSupabase()
    requireTenantId(tenantId)

    const { data, error } = await supabase
      .from(COA_TABLE)
      .select('id, account_code, account_name')
      .eq('tenant_id', tenantId)
      .eq('type', 'Asset')
      .eq('subtype', 'Bank')
      .eq('is_bank_account', true)
      .eq('is_active', true)
      .order('account_code', { ascending: true })

    throwSupabaseError(error, 'Unable to load settlement accounts.')
    return data ?? []
  },
}

export default paymentConfigurationService
