import { describe, expect, it } from "vitest"
import {
  calculateReservationNights,
  normalizeReservationPayload,
  validateReservationPayload,
} from "./reservationValidator"

describe("reservation validator", () => {
  it("calculates nights using date-only values", () => {
    expect(calculateReservationNights("2026-07-20", "2026-07-23")).toBe(3)
  })

  it("normalizes numeric and string fields", () => {
    const payload = normalizeReservationPayload({
      reservation_name: "  Ankur Stay  ",
      guest_name: "  Ankur Dutta ",
      pax_adults: "2",
      pax_children: "1",
      email: " TEST@EXAMPLE.COM ",
    })

    expect(payload.reservationName).toBe("Ankur Stay")
    expect(payload.adults).toBe(2)
    expect(payload.children).toBe(1)
    expect(payload.email).toBe("test@example.com")
  })

  it("returns field-level validation errors", () => {
    const result = validateReservationPayload({
      reservationName: "",
      guestName: "",
      checkIn: "2026-07-20",
      checkOut: "2026-07-20",
      email: "bad-email",
    })

    expect(result.valid).toBe(false)
    expect(result.errors.reservationName).toBeTruthy()
    expect(result.errors.guestName).toBeTruthy()
    expect(result.errors.checkOut).toBeTruthy()
    expect(result.errors.email).toBeTruthy()
  })

  it("accepts a valid reservation request", () => {
    const result = validateReservationPayload({
      reservationName: "Family Holiday",
      guestName: "Ankur Dutta",
      checkIn: "2026-07-20",
      checkOut: "2026-07-22",
      adults: 2,
      children: 1,
      email: "ankur@example.com",
    })

    expect(result.valid).toBe(true)
    expect(result.nights).toBe(2)
  })
})
