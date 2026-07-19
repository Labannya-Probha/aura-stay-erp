import { buildSettlementJournal } from './settlementJournalBuilder.js'
import { mapSettlementInput } from './settlementMapper.js'
import { validateSettlement } from './settlementValidator.js'
import paymentSettlementService from './services/paymentSettlement.service.js'

export class PaymentSettlementEngine {
  constructor(service = paymentSettlementService) {
    this.service = service
  }

  async prepare({ tenantId, settlement: rawSettlement }) {
    const settlement = mapSettlementInput(rawSettlement)
    const profile = await this.service.getProfile(tenantId, settlement.terminalId, settlement.provider)
    validateSettlement({ tenantId, settlement, profile })
    const journal = buildSettlementJournal({ settlement, profile })
    if (journal.totalDebit !== journal.totalCredit) throw new Error('Settlement journal is not balanced.')
    return { tenantId, settlement, profile, journal }
  }

  async post({ tenantId, settlement: rawSettlement }) {
    const prepared = await this.prepare({ tenantId, settlement: rawSettlement })
    const existing = await this.service.findSettlement(tenantId, prepared.settlement.idempotencyKey)
    if (existing?.status === 'POSTED') return { settlement: existing, journalEntryId: existing.journal_entry_id, duplicate: true }
    if (existing && existing.status !== 'FAILED') throw new Error(`Settlement is already ${String(existing.status).toLowerCase()}.`)

    let record = existing
    try {
      if (!record) record = await this.service.createDraft(tenantId, prepared.settlement, prepared.profile)
      await this.service.attachPostings(tenantId, record.id, prepared.settlement.postingIds)
      const journalEntryId = await this.service.postJournal(prepared.journal)
      const posted = await this.service.markPosted(tenantId, record.id, journalEntryId)
      return { settlement: posted, journalEntryId, duplicate: false, journal: prepared.journal }
    } catch (error) {
      await this.service.markFailed(tenantId, record?.id, error.message)
      throw error
    }
  }
}

export const paymentSettlementEngine = new PaymentSettlementEngine()
export default paymentSettlementEngine
