import { supabase } from '../../../../../lib/supabase.js'

const TABLE = 'payment_posting_queue'

function mapError(error, fallback) {
  if (!error) return
  if (error.code === '23505') throw new Error('This payment is already queued for posting.')
  if (error.code === '42501' || /policy|permission|row-level security/i.test(error.message || '')) {
    throw new Error('You do not have permission to manage the payment posting queue.')
  }
  if (/network|fetch|timeout/i.test(error.message || '')) {
    throw new Error('Network connection failed while accessing the posting queue.')
  }
  throw new Error(error.message || fallback)
}

const paymentPostingQueueService = {
  async enqueue(tenantId, payment) {
    const idempotencyKey = payment.idempotencyKey ?? payment.idempotency_key
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        tenant_id: tenantId,
        idempotency_key: idempotencyKey,
        source_module: payment.sourceModule ?? payment.source_module,
        source_reference: payment.sourceReference ?? payment.source_reference,
        payload: payment,
        status: 'PENDING',
        available_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    mapError(error, 'Unable to queue the payment posting.')
    return data
  },

  async getNext(tenantId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['PENDING', 'RETRY'])
      .lte('available_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    mapError(error, 'Unable to read the payment posting queue.')
    return data ?? null
  },

  async claim(tenantId, queueId) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: 'PROCESSING', locked_at: new Date().toISOString(), attempts: 1 })
      .eq('tenant_id', tenantId)
      .eq('id', queueId)
      .in('status', ['PENDING', 'RETRY'])
      .select('*')
      .maybeSingle()
    mapError(error, 'Unable to claim the queued payment.')
    return data ?? null
  },

  async markCompleted(tenantId, queueId, journalEntryId) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        status: 'COMPLETED',
        journal_entry_id: journalEntryId,
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('tenant_id', tenantId)
      .eq('id', queueId)
      .select('*')
      .single()
    mapError(error, 'Posting completed but the queue status could not be updated.')
    return data
  },

  async markFailed(tenantId, queue, errorMessage, maxAttempts = 3) {
    const attempts = Number(queue?.attempts || 0) + 1
    const retry = attempts < maxAttempts
    const delayMinutes = Math.min(2 ** attempts, 30)
    const availableAt = new Date(Date.now() + delayMinutes * 60_000).toISOString()
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        status: retry ? 'RETRY' : 'FAILED',
        attempts,
        available_at: retry ? availableAt : queue.available_at,
        locked_at: null,
        error_message: String(errorMessage || 'Posting failed').slice(0, 1000),
      })
      .eq('tenant_id', tenantId)
      .eq('id', queue.id)
      .select('*')
      .single()
    mapError(error, 'Unable to update the failed queue item.')
    return data
  },

  async list(tenantId, { status = null, limit = 100 } = {}) {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    mapError(error, 'Unable to list queued payments.')
    return data ?? []
  },
}

export default paymentPostingQueueService
