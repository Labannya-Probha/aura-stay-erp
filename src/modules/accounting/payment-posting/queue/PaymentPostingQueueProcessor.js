import paymentPostingEngine from '../PaymentPostingEngine.js'
import queueService from './paymentPostingQueue.service.js'

export class PaymentPostingQueueProcessor {
  constructor({ engine = paymentPostingEngine, service = queueService, maxAttempts = 3 } = {}) {
    this.engine = engine
    this.service = service
    this.maxAttempts = maxAttempts
  }

  async enqueue({ tenantId, payment }) {
    if (!tenantId) throw new Error('Tenant is required to queue a payment.')
    if (!payment) throw new Error('Payment payload is required.')
    return this.service.enqueue(tenantId, payment)
  }

  async processNext({ tenantId }) {
    const next = await this.service.getNext(tenantId)
    if (!next) return { processed: false, reason: 'EMPTY_QUEUE' }

    const claimed = await this.service.claim(tenantId, next.id)
    if (!claimed) return { processed: false, reason: 'ALREADY_CLAIMED' }

    try {
      const result = await this.engine.post({ tenantId, payment: claimed.payload })
      const completed = await this.service.markCompleted(tenantId, claimed.id, result.journalEntryId)
      return { processed: true, queue: completed, posting: result }
    } catch (error) {
      const failed = await this.service.markFailed(tenantId, claimed, error.message, this.maxAttempts)
      return { processed: false, queue: failed, error }
    }
  }

  async drain({ tenantId, limit = 25 }) {
    const results = []
    for (let index = 0; index < limit; index += 1) {
      const result = await this.processNext({ tenantId })
      results.push(result)
      if (result.reason === 'EMPTY_QUEUE') break
    }
    return results
  }
}

export const paymentPostingQueueProcessor = new PaymentPostingQueueProcessor()
export default paymentPostingQueueProcessor
