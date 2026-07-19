function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export function validateSettlement({ tenantId, settlement, profile = null }) {
  const errors = []
  if (!tenantId) errors.push('Tenant is required.')
  if (!settlement.settlementReference) errors.push('Settlement reference is required.')
  if (!settlement.settlementDate) errors.push('Settlement date is required.')
  if (!(settlement.grossAmount > 0)) errors.push('Gross settlement amount must be greater than zero.')
  if (settlement.feeAmount < 0 || settlement.taxAmount < 0) errors.push('Fee and tax amounts cannot be negative.')
  if (!settlement.clearingAccountId && !profile?.clearing_account_id) errors.push('Clearing account is required.')
  if (!settlement.bankAccountId && !profile?.bank_account_id) errors.push('Bank account is required.')
  if (settlement.feeAmount > 0 && !settlement.feeAccountId && !profile?.fee_account_id) errors.push('Fee expense account is required.')
  if (settlement.taxAmount > 0 && !settlement.taxAccountId && !profile?.tax_account_id) errors.push('Tax account is required.')

  const expectedNet = money(settlement.grossAmount - settlement.feeAmount - settlement.taxAmount)
  if (money(settlement.netAmount) !== expectedNet) {
    errors.push(`Net amount must equal gross less fee and tax (${expectedNet.toFixed(2)}).`)
  }
  if (profile && profile.tenant_id !== tenantId) errors.push('Settlement profile belongs to another tenant.')
  if (profile?.is_active === false) errors.push('Settlement profile is inactive.')

  if (errors.length) {
    const error = new Error(errors.join(' '))
    error.validationErrors = errors
    throw error
  }
  return true
}
