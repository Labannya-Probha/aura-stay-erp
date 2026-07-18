import { PAYMENT_METHODS, POSTING_TYPES, normalizePaymentMethod } from './types.js'

const DEFAULT_RULES = Object.freeze({
  [PAYMENT_METHODS.CASH]: { requiresTerminal: false, requiresSettlementAccount: true },
  [PAYMENT_METHODS.CARD]: { requiresTerminal: true, requiresSettlementAccount: true },
  [PAYMENT_METHODS.BANK_TRANSFER]: { requiresTerminal: false, requiresSettlementAccount: true },
  [PAYMENT_METHODS.CHEQUE]: { requiresTerminal: false, requiresSettlementAccount: true },
  [PAYMENT_METHODS.MOBILE_BANKING]: { requiresTerminal: false, requiresSettlementAccount: true },
  [PAYMENT_METHODS.OTHER]: { requiresTerminal: false, requiresSettlementAccount: true },
})

export function getDefaultPostingRule(method) {
  return DEFAULT_RULES[normalizePaymentMethod(method)] ?? null
}

export function resolvePostingRule({ payment, configuredRules = [], terminal = null }) {
  const method = normalizePaymentMethod(payment?.method)
  const configured = configuredRules.find(
    (rule) =>
      rule.is_active !== false &&
      normalizePaymentMethod(rule.payment_method) === method &&
      (!rule.terminal_id || rule.terminal_id === payment?.terminalId || rule.terminal_id === payment?.pos_terminal_id),
  )

  if (configured) return configured

  const defaults = getDefaultPostingRule(method)
  if (!defaults) return null

  return {
    payment_method: method,
    posting_type: POSTING_TYPES.RECEIPT,
    terminal_id: terminal?.id ?? payment?.terminalId ?? payment?.pos_terminal_id ?? null,
    settlement_account_id:
      terminal?.settlement_account_id ??
      terminal?.coa_account_id ??
      payment?.settlementAccountId ??
      payment?.bank_account_id ??
      null,
    is_active: true,
    ...defaults,
  }
}
