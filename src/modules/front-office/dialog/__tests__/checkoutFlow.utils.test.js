import { describe, expect, it } from 'vitest'

import { getCheckoutSettlementWarning } from '../checkoutFlow.utils'

describe('getCheckoutSettlementWarning', () => {
  it('allows checkout without a payment when balance is due', () => {
    expect(getCheckoutSettlementWarning({ due: 3500, amount: 0 })).toBeNull()
  })

  it('warns for partial settlement when a balance remains', () => {
    const warning = getCheckoutSettlementWarning({ due: 3500, amount: 1200 })

    expect(warning).toContain('Outstanding balance')
    expect(warning).toContain('৳3,500')
  })
})
