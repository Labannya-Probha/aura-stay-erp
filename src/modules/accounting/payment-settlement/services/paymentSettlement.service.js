import { supabase } from '../../../../lib/supabase.js'
import { postJournal } from '../../../../lib/posting.js'

const PROFILES = 'payment_settlement_profiles'
const SETTLEMENTS = 'payment_settlements'
const ITEMS = 'payment_settlement_items'

function mapError(error, fallback) {
  if (!error) return
  if (error.code === '23505') throw new Error('This provider settlement has already been recorded.')
  if (error.code === '42501' || /policy|permission|row-level security/i.test(error.message || '')) {
    throw new Error('You do not have permission to post this settlement.')
  }
  if (/network|fetch|timeout/i.test(error.message || '')) throw new Error('Network connection failed while posting the settlement.')
  throw new Error(error.message || fallback)
}

const paymentSettlementService = {
  async getProfile(tenantId, terminalId, provider = null) {
    let query = supabase.from(PROFILES).select('*').eq('tenant_id', tenantId).eq('is_active', true)
    if (terminalId) query = query.eq('terminal_id', terminalId)
    else if (provider) query = query.eq('provider', provider).is('terminal_id', null)
    else return null
    const { data, error } = await query.order('terminal_id', { ascending: false }).limit(1).maybeSingle()
    mapError(error, 'Unable to load the settlement profile.')
    return data ?? null
  },

  async findSettlement(tenantId, idempotencyKey) {
    const { data, error } = await supabase
      .from(SETTLEMENTS)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    mapError(error, 'Unable to verify settlement status.')
    return data ?? null
  },

  async createDraft(tenantId, settlement, profile) {
    const { data, error } = await supabase
      .from(SETTLEMENTS)
      .insert({
        tenant_id: tenantId,
        settlement_profile_id: profile?.id ?? null,
        terminal_id: settlement.terminalId,
        provider: settlement.provider || profile?.provider,
        settlement_reference: settlement.settlementReference,
        idempotency_key: settlement.idempotencyKey,
        settlement_date: settlement.settlementDate,
        currency: settlement.currency,
        gross_amount: settlement.grossAmount,
        fee_amount: settlement.feeAmount,
        tax_amount: settlement.taxAmount,
        net_amount: settlement.netAmount,
        status: 'PROCESSING',
      })
      .select('*')
      .single()
    mapError(error, 'Unable to create the settlement record.')
    return data
  },

  async attachPostings(tenantId, settlementId, postingIds = []) {
    if (!postingIds.length) return []
    const rows = postingIds.map((paymentPostingId) => ({ tenant_id: tenantId, settlement_id: settlementId, payment_posting_id: paymentPostingId }))
    const { data, error } = await supabase.from(ITEMS).insert(rows).select('*')
    mapError(error, 'Unable to link payment postings to the settlement.')
    return data ?? []
  },

  async markPosted(tenantId, settlementId, journalEntryId) {
    const { data, error } = await supabase
      .from(SETTLEMENTS)
      .update({ status: 'POSTED', journal_entry_id: journalEntryId, posted_at: new Date().toISOString(), error_message: null })
      .eq('tenant_id', tenantId)
      .eq('id', settlementId)
      .select('*')
      .single()
    mapError(error, 'Settlement posted but its status could not be updated.')
    return data
  },

  async markFailed(tenantId, settlementId, message) {
    if (!settlementId) return
    await supabase.from(SETTLEMENTS).update({ status: 'FAILED', error_message: String(message || 'Settlement failed').slice(0, 1000) }).eq('tenant_id', tenantId).eq('id', settlementId)
  },

  postJournal,
}

export default paymentSettlementService
