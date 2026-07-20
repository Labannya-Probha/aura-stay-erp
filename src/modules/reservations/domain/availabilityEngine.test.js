import { describe, expect, it } from "vitest"
import { calculateAvailability } from "./availabilityEngine"

describe("calculateAvailability", () => {
  it("calculates minimum availability across the entire stay", () => {
    const result = calculateAvailability({
      checkIn: "2026-07-20", checkOut: "2026-07-23",
      roomTypes: [{ id: "DELUXE", name: "Deluxe", roomCount: 3 }],
      reservations: [{ roomTypeId: "DELUXE", status: "CONFIRMED", checkIn: "2026-07-21", checkOut: "2026-07-23", quantity: 2 }],
    })
    expect(result[0].minimumAvailable).toBe(1)
    expect(result[0].canSell).toBe(true)
  })

  it("honours out-of-order rooms and controlled overbooking", () => {
    const result = calculateAvailability({
      checkIn: "2026-07-20", checkOut: "2026-07-21",
      roomTypes: [{ id: "FAMILY", roomCount: 2 }],
      reservations: [{ roomTypeId: "FAMILY", status: "GUARANTEED", checkIn: "2026-07-20", checkOut: "2026-07-21", quantity: 2 }],
      outOfOrder: [{ roomTypeId: "FAMILY", fromDate: "2026-07-20", toDate: "2026-07-21" }],
      overbookingRules: [{ roomTypeId: "FAMILY", limit: 1 }],
    })
    expect(result[0].daily[0].sellable).toBe(2)
    expect(result[0].daily[0].available).toBe(0)
  })
})
