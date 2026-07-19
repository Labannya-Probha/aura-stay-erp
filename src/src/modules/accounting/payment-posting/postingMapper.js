export function mapPaymentToPostingInput(payment = {}) {
  return {
    idempotencyKey: payment.idempotencyKey ?? payment.idempotency_key ?? null,
    sourceModule: payment.sourceModule ?? payment.source_module ?? null,
    sourceReference: payment.sourceReference ?? payment.source_reference ?? payment.payment_id ?? null,
    paymentId: payment.paymentId ?? payment.payment_id ?? payment.id ?? null,
    method: payment.method,
    amount: Number(payment.amount || 0),
    currency: String(payment.currency || 'BDT').toUpperCase(),
    exchangeRate: Number(payment.exchangeRate ?? payment.exchange_rate ?? 1),
    terminalId: payment.terminalId ?? payment.pos_terminal_id ?? null,
    settlementAccountId: payment.settlementAccountId ?? payment.bank_account_id ?? null,
    receivableAccountId: payment.receivableAccountId ?? payment.receivable_account_id ?? null,
    receivedDate: payment.receivedDate ?? payment.received_date ?? new Date().toISOString().slice(0, 10),
    narration: payment.narration ?? payment.notes ?? null,
    postedBy: payment.postedBy ?? payment.posted_by ?? 'SYSTEM',
  }
}
