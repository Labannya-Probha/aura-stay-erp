import { POSTING_TYPES } from './types.js'

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export function buildPaymentJournal({ payment, rule }) {
  const baseAmount = roundMoney(payment.amount * (payment.exchangeRate || 1))
  const postingType = rule.posting_type || POSTING_TYPES.RECEIPT
  const isRefund = postingType === POSTING_TYPES.REFUND

  const settlementLine = {
    account_id: rule.settlement_account_id,
    debit: isRefund ? 0 : baseAmount,
    credit: isRefund ? baseAmount : 0,
    note: `${payment.method} ${postingType.toLowerCase()}`,
  }
  const sourceLine = {
    account_id: payment.receivableAccountId,
    debit: isRefund ? baseAmount : 0,
    credit: isRefund ? 0 : baseAmount,
    note: payment.sourceReference,
  }

  return {
    jv_date: payment.receivedDate,
    source: `PAYMENT_${payment.sourceModule}`.slice(0, 50),
    posted_by: payment.postedBy,
    narration:
      payment.narration ||
      `${postingType} ${payment.sourceReference} via ${payment.method}`,
    lines: [settlementLine, sourceLine],
    totalDebit: baseAmount,
    totalCredit: baseAmount,
  }
}
