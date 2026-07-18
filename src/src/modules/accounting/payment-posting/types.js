export const PAYMENT_METHODS = Object.freeze({
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
  MOBILE_BANKING: 'MOBILE_BANKING',
  OTHER: 'OTHER',
})

export const POSTING_STATES = Object.freeze({
  DRAFT: 'DRAFT',
  READY: 'READY',
  POSTED: 'POSTED',
  FAILED: 'FAILED',
  REVERSED: 'REVERSED',
})

export const POSTING_TYPES = Object.freeze({
  RECEIPT: 'RECEIPT',
  REFUND: 'REFUND',
  SETTLEMENT: 'SETTLEMENT',
})

export function normalizePaymentMethod(value) {
  const method = String(value || '').trim().toUpperCase()
  if (method === 'BANK') return PAYMENT_METHODS.BANK_TRANSFER
  if (method === 'MFS' || method === 'MOBILE') return PAYMENT_METHODS.MOBILE_BANKING
  return method
}
