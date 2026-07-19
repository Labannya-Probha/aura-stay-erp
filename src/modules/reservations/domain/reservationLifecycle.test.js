import { describe, expect, it } from "vitest"
import {
  assertReservationTransition,
  canTransitionReservation,
  getAllowedReservationTransitions,
  isTerminalReservationStatus,
  normalizeReservationStatus,
} from "./reservationLifecycle"

describe("reservation lifecycle", () => {
  it("normalizes common status formats", () => {
    expect(normalizeReservationStatus("checked-in")).toBe("CHECKED_IN")
    expect(normalizeReservationStatus("no show")).toBe("NO_SHOW")
  })

  it("allows valid enterprise transitions", () => {
    expect(canTransitionReservation("PENDING", "CONFIRMED")).toBe(true)
    expect(canTransitionReservation("CONFIRMED", "CHECKED_IN")).toBe(true)
    expect(canTransitionReservation("CHECKED_IN", "CHECKED_OUT")).toBe(true)
  })

  it("blocks invalid reverse transitions", () => {
    expect(canTransitionReservation("CHECKED_OUT", "CONFIRMED")).toBe(false)
    expect(() => assertReservationTransition("CANCELLED", "CONFIRMED")).toThrow()
  })

  it("identifies terminal statuses", () => {
    expect(isTerminalReservationStatus("NO_SHOW")).toBe(true)
    expect(isTerminalReservationStatus("CONFIRMED")).toBe(false)
    expect(getAllowedReservationTransitions("CHECKED_IN")).toEqual(["CHECKED_OUT"])
  })
})
