import { describe, expect, it } from "vitest"
import {
  APPROVAL_TYPE,
  RESERVATION_ACTION,
  buildAmendmentSnapshot,
  diffReservationSnapshot,
  requiresApproval,
  resolveWorkflowTargetStatus,
} from "./reservationWorkflow"

describe("reservation workflow", () => {
  it("resolves valid status actions", () => {
    expect(resolveWorkflowTargetStatus(RESERVATION_ACTION.CONFIRM, "PENDING")).toBe("CONFIRMED")
  })

  it("reinstates cancelled reservations", () => {
    expect(resolveWorkflowTargetStatus(RESERVATION_ACTION.REINSTATE, "CANCELLED")).toBe("CONFIRMED")
  })

  it("detects approval thresholds", () => {
    expect(requiresApproval(APPROVAL_TYPE.DISCOUNT, { discountPercent: 15, allowedDiscountPercent: 10 })).toBe(true)
    expect(requiresApproval(APPROVAL_TYPE.DISCOUNT, { discountPercent: 5, allowedDiscountPercent: 10 })).toBe(false)
  })

  it("creates auditable amendment diffs", () => {
    const before = buildAmendmentSnapshot({ check_in: "2026-07-20", status: "PENDING", pax_adults: 2 })
    const after = { ...before, check_in: "2026-07-21", adults: 3 }
    expect(diffReservationSnapshot(before, after)).toEqual({
      check_in: { before: "2026-07-20", after: "2026-07-21" },
      adults: { before: 2, after: 3 },
    })
  })
})
