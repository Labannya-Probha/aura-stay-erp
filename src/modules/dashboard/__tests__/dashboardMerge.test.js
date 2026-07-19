import { describe, expect, it } from "vitest"
import { mergeDashboardData } from "../hooks/useDashboard"

describe("mergeDashboardData", () => {
  it("keeps safe defaults while merging partial live data", () => {
    const result = mergeDashboardData({ summary: { occupancy: 72 }, tasks: [{ id: 1 }] })
    expect(result.summary.occupancy).toBe(72)
    expect(result.summary.adr).toBe(0)
    expect(result.housekeeping.clean).toBe(0)
    expect(result.tasks).toHaveLength(1)
  })
})
