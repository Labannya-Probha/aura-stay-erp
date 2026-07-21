import { Queue, Worker } from 'bullmq'
import { redisConnection } from './connection.js'

export const notificationQueue = new Queue('notifications', { connection: redisConnection })

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    console.log('[notifications] processed job', job.id)
    return { ok: true }
  },
  { connection: redisConnection, concurrency: 10 },
)

notificationWorker.on('failed', (job, err) => {
  console.error(`[notifications] job ${job?.id} failed:`, err.message)
})
