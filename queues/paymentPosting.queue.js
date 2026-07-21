import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { redisConnection } from './connection.js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for payment worker.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export const paymentPostingQueue = new Queue('payment-posting', { connection: redisConnection })

export const paymentPostingWorker = new Worker(
  'payment-posting',
  async (job) => {
    const { queueId, tenantId, status = 'POSTED' } = job.data || {}

    if (!queueId || !tenantId) {
      throw new Error('queueId and tenantId are required in payment posting job payload.')
    }

    const { error } = await supabase
      .from('payment_posting_queue')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', queueId)
      .eq('tenant_id', tenantId)

    if (error) throw error

    return { queueId, status }
  },
  { connection: redisConnection, concurrency: 5 },
)

paymentPostingWorker.on('failed', (job, err) => {
  console.error(`[payment-posting] job ${job?.id} failed:`, err.message)
})
