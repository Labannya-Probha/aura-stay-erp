export function mapSettlementInput(input = {}) {
  const grossAmount = Number(input.grossAmount ?? input.gross_amount ?? 0)
  const feeAmount = Number(input.feeAmount ?? input.fee_amount ?? 0)
  const taxAmount = Number(input.taxAmount ?? input.tax_amount ?? 0)
  const netAmount = Number(input.netAmount ?? input.net_amount ?? grossAmount - feeAmount - taxAmount)

  return {
    settlementReference: input.settlementReference ?? input.settlement_reference ?? null,
    terminalId: input.terminalId ?? input.terminal_id ?? null,
    provider: input.provider ?? null,
    currency: String(input.currency || 'BDT').toUpperCase(),
    settlementDate: input.settlementDate ?? input.settlement_date ?? new Date().toISOString().slice(0, 10),
    grossAmount,
    feeAmount,
    taxAmount,
    netAmount,
    clearingAccountId: input.clearingAccountId ?? input.clearing_account_id ?? null,
    bankAccountId: input.bankAccountId ?? input.bank_account_id ?? null,
    feeAccountId: input.feeAccountId ?? input.fee_account_id ?? null,
    taxAccountId: input.taxAccountId ?? input.tax_account_id ?? null,
    postedBy: input.postedBy ?? input.posted_by ?? 'SYSTEM',
    narration: input.narration ?? null,
    postingIds: input.postingIds ?? input.posting_ids ?? [],
    idempotencyKey:
      input.idempotencyKey ??
      input.idempotency_key ??
      [input.terminalId ?? input.terminal_id ?? 'provider', input.settlementReference ?? input.settlement_reference ?? 'settlement'].join(':'),
  }
}
