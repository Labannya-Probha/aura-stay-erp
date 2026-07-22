import { describe, it, expect } from 'vitest'
import { buildPaymentJournal } from '../paymentJournalBuilder.js'
import { POSTING_TYPES } from '../types.js'

const basePayment = {
  amount: 1000,
  exchangeRate: 1,
  method: 'CASH',
  sourceModule: 'FRONT_OFFICE',
  sourceReference: 'RES-2026-0001',
  receivableAccountId: 'acc-receivable-id',
  receivedDate: '2026-07-21',
  postedBy: 'test-user',
}

const receiptRule = {
  posting_type: POSTING_TYPES.RECEIPT,
  settlement_account_id: 'acc-cash-id',
}

const refundRule = {
  posting_type: POSTING_TYPES.REFUND,
  settlement_account_id: 'acc-cash-id',
}

describe('buildPaymentJournal - double-entry integrity', () => {
  it('produces a balanced journal (total debit === total credit) for a receipt', () => {
    const journal = buildPaymentJournal({ payment: basePayment, rule: receiptRule })
    expect(journal.totalDebit).toBe(journal.totalCredit)

    const sumDebit = journal.lines.reduce((s, l) => s + l.debit, 0)
    const sumCredit = journal.lines.reduce((s, l) => s + l.credit, 0)
    expect(sumDebit).toBe(sumCredit)
  })

  it('debits the settlement account and credits the receivable account for a receipt', () => {
    const journal = buildPaymentJournal({ payment: basePayment, rule: receiptRule })
    const settlementLine = journal.lines.find((l) => l.account_id === 'acc-cash-id')
    const sourceLine = journal.lines.find((l) => l.account_id === 'acc-receivable-id')

    expect(settlementLine.debit).toBe(1000)
    expect(settlementLine.credit).toBe(0)
    expect(sourceLine.debit).toBe(0)
    expect(sourceLine.credit).toBe(1000)
  })

  it('flips debit/credit sides for a refund, and still balances', () => {
    const journal = buildPaymentJournal({ payment: basePayment, rule: refundRule })
    expect(journal.totalDebit).toBe(journal.totalCredit)

    const settlementLine = journal.lines.find((l) => l.account_id === 'acc-cash-id')
    const sourceLine = journal.lines.find((l) => l.account_id === 'acc-receivable-id')

    expect(settlementLine.debit).toBe(0)
    expect(settlementLine.credit).toBe(1000)
    expect(sourceLine.debit).toBe(1000)
    expect(sourceLine.credit).toBe(0)
  })

  it('applies the exchange rate before splitting into journal lines', () => {
    const journal = buildPaymentJournal({
      payment: { ...basePayment, amount: 100, exchangeRate: 1.5 },
      rule: receiptRule,
    })
    expect(journal.totalDebit).toBe(150)
    expect(journal.totalCredit).toBe(150)
  })

  it('rounds to 2 decimal places to avoid floating-point drift breaking balance', () => {
    const journal = buildPaymentJournal({
      payment: { ...basePayment, amount: 33.333, exchangeRate: 1 },
      rule: receiptRule,
    })
    expect(journal.totalDebit).toBe(33.33)
    expect(journal.totalCredit).toBe(33.33)
  })
})
