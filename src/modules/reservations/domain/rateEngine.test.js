import { describe, expect, it } from "vitest"
import { priceStay } from "./rateEngine"

describe("priceStay", () => {
  it("applies dated percentage and extra guest pricing per night", () => {
    const quote = priceStay({
      checkIn: "2026-07-24", checkOut: "2026-07-26", baseRate: 5000,
      rules: [{ code: "WEEKEND", adjustmentType: "PERCENT", value: 10, daysOfWeek: [5, 6] }],
      guests: { adults: 3, includedAdults: 2, extraAdultRate: 1000 },
    })
    expect(quote.nights).toBe(2)
    expect(quote.roomTotal).toBe(13000)
    expect(quote.averageNightlyRate).toBe(6500)
  })
})
