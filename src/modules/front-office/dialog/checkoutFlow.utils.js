export function getCheckoutSettlementWarning({ due = 0, amount = 0 } = {}) {
  const dueAmount = Number(due || 0)
  const settlementAmount = Number(amount || 0)

  if (dueAmount <= 0) return null
  if (settlementAmount <= 0) return null
  if (settlementAmount >= dueAmount) return null

  return `Outstanding balance is ৳${dueAmount.toLocaleString('en-BD')}. Continue with partial settlement?`
}
