import { supabase } from '../../../../lib/supabase.js'
import { postJournal } from '../../../../lib/posting.js'

const RULES_TABLE = 'payment_posting_rules'
const POSTINGS_TABLE = 'payment_postings'
const TERMINALS_TABLE = 'payment_terminals'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

function mapError(error, fallback) {
  if (!error) return
  if (error.code === '23505') throw new Error('This payment has already been posted.')
  if (error.code === '42501' || /policy|permission|row-level security/i.test(error.message || '')) {
    throw new Error('You do not have permission to post this payment.')
  }
  if (/network|fetch|timeout/i.test(error.message || '')) {
    throw new Error('Network connection failed while posting the payment.')
  }
  throw new Error(error.message || fallback)
}

const paymentPostingService = {
  async listRules(tenantId, method = null) {
    requireSupabase()
    let query = supabase.from(RULES_TABLE).select('*').eq('tenant_id', tenantId).eq('is_active', true)
    if (method) query = query.eq('payment_method', method)
    const { data, error } = await query.order('priority', { ascending: true })
    mapError(error, 'Unable to load payment posting rules.')
    return data ?? []
  },

  async getTerminal(tenantId, terminalId) {
    if (!terminalId) return null
    const { data, error } = await supabase
      .from(TERMINALS_TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', terminalId)
      .eq('is_active', true)
      .maybeSingle()
    mapError(error, 'Unable to load payment terminal.')
    return data ?? null
  },

  async findPosting(tenantId, idempotencyKey) {
    if (!idempotencyKey) return null
    const { data, error } = await supabase
      .from(POSTINGS_TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    mapError(error, 'Unable to verify payment posting status.')
    return data ?? null
  },

  async createPendingPosting(tenantId, payment, rule) {
    const { data, error } = await supabase
      .from(POSTINGS_TABLE)
      .insert({
        tenant_id: tenantId,
        payment_id: payment.paymentId,
        idempotency_key: payment.idempotencyKey,
        source_module: payment.sourceModule,
        source_reference: payment.sourceReference,
        payment_method: payment.method,
        terminal_id: payment.terminalId,
        posting_rule_id: rule.id ?? null,
        amount: payment.amount,
        currency: payment.currency,
        status: 'READY',
      })
      .select('*')
      .single()
    mapError(error, 'Unable to create the payment posting record.')
    return data
  },

  async markPosted(tenantId, postingId, journalEntryId) {
    const { data, error } = await supabase
      .from(POSTINGS_TABLE)
      .update({ status: 'POSTED', journal_entry_id: journalEntryId, posted_at: new Date().toISOString(), error_message: null })
      .eq('tenant_id', tenantId)
      .eq('id', postingId)
      .select('*')
      .single()
    mapError(error, 'Journal posted but posting status could not be updated.')
    return data
  },

  async markFailed(tenantId, postingId, errorMessage) {
    if (!postingId) return
    await supabase
      .from(POSTINGS_TABLE)
      .update({ status: 'FAILED', error_message: String(errorMessage || 'Posting failed').slice(0, 1000) })
      .eq('tenant_id', tenantId)
      .eq('id', postingId)
  },

  postJournal,
}

export default paymentPostingService
