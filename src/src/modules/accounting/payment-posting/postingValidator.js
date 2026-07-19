import { normalizePaymentMethod } from './types.js'

export class PaymentPostingValidationError extends Error {
  constructor(errors) {
    super(errors.join(' '))
    this.name = 'PaymentPostingValidationError'
    this.errors = errors
  }
}

export function validatePostingContext({ tenantId, payment, rule, terminal }) {
  const errors = []
  const amount = Number(payment?.amount)
  const method = normalizePaymentMethod(payment?.method)

  if (!tenantId) errors.push('Tenant ID is required.')
  if (!payment?.sourceModule) errors.push('Payment source module is required.')
  if (!payment?.sourceReference) errors.push('Payment source reference is required.')
  if (!payment?.receivableAccountId) errors.push('Receivable or source account is required.')
  if (!method) errors.push('Payment method is required.')
  if (!Number.isFinite(amount) || amount <= 0) errors.push('Payment amount must be greater than zero.')
  if (!rule) errors.push(`No posting rule is configured for ${method || 'this payment method'}.`)

  if (rule?.tenant_id && rule.tenant_id !== tenantId) {
    errors.push('Posting rule belongs to another tenant.')
  }
  if (rule?.requiresTerminal && !terminal) errors.push('An active payment terminal is required.')
  if (terminal?.tenant_id && terminal.tenant_id !== tenantId) errors.push('Payment terminal belongs to another tenant.')
  if (terminal && terminal.is_active === false) errors.push('Payment terminal is inactive.')
  if (!rule?.settlement_account_id) errors.push('Settlement or clearing account is not configured.')

  const currency = String(payment?.currency || 'BDT').toUpperCase()
  if (currency !== 'BDT' && !payment?.exchangeRate) {
    errors.push(`Exchange rate is required for ${currency}.`)
  }

  if (errors.length) throw new PaymentPostingValidationError(errors)
  return true
}
