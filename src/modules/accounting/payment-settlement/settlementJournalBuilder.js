function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export function buildSettlementJournal({ settlement, profile = {} }) {
  const bankAccountId = settlement.bankAccountId || profile.bank_account_id
  const clearingAccountId = settlement.clearingAccountId || profile.clearing_account_id
  const feeAccountId = settlement.feeAccountId || profile.fee_account_id
  const taxAccountId = settlement.taxAccountId || profile.tax_account_id
  const lines = [
    {
      account_id: bankAccountId,
      debit: roundMoney(settlement.netAmount),
      credit: 0,
      note: `Net settlement ${settlement.settlementReference}`,
    },
  ]

  if (settlement.feeAmount > 0) {
    lines.push({ account_id: feeAccountId, debit: roundMoney(settlement.feeAmount), credit: 0, note: 'Payment processing fee' })
  }
  if (settlement.taxAmount > 0) {
    lines.push({ account_id: taxAccountId, debit: roundMoney(settlement.taxAmount), credit: 0, note: 'Tax on payment processing fee' })
  }
  lines.push({
    account_id: clearingAccountId,
    debit: 0,
    credit: roundMoney(settlement.grossAmount),
    note: `Clear ${settlement.provider || 'payment provider'} receivable`,
  })

  return {
    jv_date: settlement.settlementDate,
    source: 'PAYMENT_SETTLEMENT',
    posted_by: settlement.postedBy,
    narration: settlement.narration || `Settlement ${settlement.settlementReference}`,
    lines,
    totalDebit: roundMoney(settlement.netAmount + settlement.feeAmount + settlement.taxAmount),
    totalCredit: roundMoney(settlement.grossAmount),
  }
}
