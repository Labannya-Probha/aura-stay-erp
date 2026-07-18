import { buildPaymentJournal } from './paymentJournalBuilder.js'
import { mapPaymentToPostingInput } from './postingMapper.js'
import { resolvePostingRule } from './postingRules.js'
import { validatePostingContext } from './postingValidator.js'
import paymentPostingService from './services/paymentPosting.service.js'

function createIdempotencyKey(tenantId, payment) {
  return [tenantId, payment.sourceModule, payment.sourceReference, payment.paymentId || 'payment'].join(':')
}

export class PaymentPostingEngine {
  constructor(service = paymentPostingService) {
    this.service = service
  }

  async prepare({ tenantId, payment: rawPayment }) {
    const payment = mapPaymentToPostingInput(rawPayment)
    payment.idempotencyKey ||= createIdempotencyKey(tenantId, payment)

    const [configuredRules, terminal] = await Promise.all([
      this.service.listRules(tenantId, payment.method),
      this.service.getTerminal(tenantId, payment.terminalId),
    ])
    const rule = resolvePostingRule({ payment, configuredRules, terminal })
    validatePostingContext({ tenantId, payment, rule, terminal })
    const journal = buildPaymentJournal({ payment, rule })

    return { tenantId, payment, terminal, rule, journal }
  }

  async post({ tenantId, payment: rawPayment }) {
    const prepared = await this.prepare({ tenantId, payment: rawPayment })
    const existing = await this.service.findPosting(tenantId, prepared.payment.idempotencyKey)

    if (existing?.status === 'POSTED') {
      return { posting: existing, journalEntryId: existing.journal_entry_id, duplicate: true }
    }
    if (existing && existing.status !== 'FAILED') {
      throw new Error(`Payment posting is already ${String(existing.status).toLowerCase()}.`)
    }

    let posting = existing
    try {
      if (!posting) {
        posting = await this.service.createPendingPosting(tenantId, prepared.payment, prepared.rule)
      }
      const journalEntryId = await this.service.postJournal(prepared.journal)
      const posted = await this.service.markPosted(tenantId, posting.id, journalEntryId)
      return { posting: posted, journalEntryId, duplicate: false, journal: prepared.journal }
    } catch (error) {
      await this.service.markFailed(tenantId, posting?.id, error.message)
      throw error
    }
  }
}

export const paymentPostingEngine = new PaymentPostingEngine()
export default paymentPostingEngine
