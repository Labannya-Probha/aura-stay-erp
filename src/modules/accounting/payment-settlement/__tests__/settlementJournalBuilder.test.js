import { describe, expect, it } from 'vitest'
import { buildSettlementJournal } from '../settlementJournalBuilder.js'
import { mapSettlementInput } from '../settlementMapper.js'
import { validateSettlement } from '../settlementValidator.js'

describe('payment settlement journal', () => {
  it('builds a balanced net bank, fee and clearing journal', () => {
    const settlement = mapSettlementInput({
      settlementReference: 'CITY-20260720-01',
      grossAmount: 10000,
      feeAmount: 180,
      taxAmount: 27,
      terminalId: 'terminal-1',
      clearingAccountId: 'clearing',
      bankAccountId: 'bank',
      feeAccountId: 'fees',
      taxAccountId: 'tax',
    })
    validateSettlement({ tenantId: 'tenant-1', settlement })
    const journal = buildSettlementJournal({ settlement })
    expect(journal.totalDebit).toBe(10000)
    expect(journal.totalCredit).toBe(10000)
    expect(journal.lines).toHaveLength(4)
    expect(journal.lines[0].debit).toBe(9793)
  })

  it('rejects an inconsistent net amount', () => {
    const settlement = mapSettlementInput({
      settlementReference: 'BAD-1', grossAmount: 1000, feeAmount: 10, netAmount: 1000,
      clearingAccountId: 'clearing', bankAccountId: 'bank', feeAccountId: 'fees',
    })
    expect(() => validateSettlement({ tenantId: 'tenant-1', settlement })).toThrow(/Net amount/)
  })
})
