import { describe, expect, it } from 'vitest'
import { buildPaymentJournal } from '../paymentJournalBuilder.js'

const payment = {
  method: 'CARD',
  amount: 10000,
  exchangeRate: 1,
  receivableAccountId: 'ar-account',
  sourceModule: 'FRONT_OFFICE',
  sourceReference: 'FOLIO-1001',
  receivedDate: '2026-07-19',
  postedBy: 'user-1',
}

it('builds a balanced receipt journal', () => {
  const result = buildPaymentJournal({
    payment,
    rule: { settlement_account_id: 'card-clearing', posting_type: 'RECEIPT' },
  })
  expect(result.totalDebit).toBe(10000)
  expect(result.totalCredit).toBe(10000)
  expect(result.lines).toEqual([
    expect.objectContaining({ account_id: 'card-clearing', debit: 10000, credit: 0 }),
    expect.objectContaining({ account_id: 'ar-account', debit: 0, credit: 10000 }),
  ])
})

describe('refund journal', () => {
  it('reverses debit and credit direction', () => {
    const result = buildPaymentJournal({
      payment,
      rule: { settlement_account_id: 'card-clearing', posting_type: 'REFUND' },
    })
    expect(result.lines[0]).toEqual(expect.objectContaining({ debit: 0, credit: 10000 }))
    expect(result.lines[1]).toEqual(expect.objectContaining({ debit: 10000, credit: 0 }))
  })
})
