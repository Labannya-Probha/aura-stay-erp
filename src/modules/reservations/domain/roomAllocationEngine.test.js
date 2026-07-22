import { describe, expect, it } from "vitest"
import { selectBestRooms } from "./roomAllocationEngine"

describe("selectBestRooms", () => {
  it("excludes conflicts and prefers matching room preferences", () => {
    const result = selectBestRooms({
      checkIn: "2026-08-01", checkOut: "2026-08-03", roomTypeId: "DELUXE", preferences: { floor: 2 },
      rooms: [
        { id: "1", room_no: "201", room_type: "DELUXE", floor: 2, is_active: true },
        { id: "2", room_no: "202", room_type: "DELUXE", floor: 2, is_active: true },
      ],
      assignments: [{ room_id: "1", from_date: "2026-08-01", to_date: "2026-08-02", status: "CONFIRMED" }],
    }, 1)
    expect(result.selected[0].id).toBe("2")
    expect(result.insufficient).toBe(false)
  })
})
