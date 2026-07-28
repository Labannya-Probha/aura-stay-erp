/**
 * Resolves a report Cycle ("Daily" / "Weekly" / "Monthly" / "Quarterly" /
 * "Half-Yearly" / "Yearly" / "Custom Date Range") into a concrete
 * { start_date, end_date } pair, anchored to a reference date (today by
 * default).
 *
 * This is the piece that was missing: the cycle dropdown updated its own
 * displayed value, and the report re-ran on any filter change, but nothing
 * ever recalculated start_date/end_date from the newly selected cycle — so
 * picking "Weekly" instead of "Monthly" silently queried the same date
 * range as before. This function is the single source of truth every
 * report's cycle selector should call through, per the spec's requirement
 * for one shared, reusable date-range resolver rather than per-report logic.
 */
export function resolveCycleDateRange(cycle, referenceDate = new Date()) {
  const ref = new Date(referenceDate)
  const iso = (d) => d.toISOString().slice(0, 10)
  const endOfToday = iso(ref)

  switch (cycle) {
    case 'Daily':
      return { start_date: endOfToday, end_date: endOfToday }

    case 'Weekly': {
      // Monday-start week, matching Bangladesh/ISO business convention.
      const day = ref.getDay() // 0 = Sunday
      const diffToMonday = day === 0 ? 6 : day - 1
      const monday = new Date(ref)
      monday.setDate(ref.getDate() - diffToMonday)
      return { start_date: iso(monday), end_date: endOfToday }
    }

    case 'Monthly': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1)
      return { start_date: iso(start), end_date: endOfToday }
    }

    case 'Quarterly': {
      const quarterStartMonth = Math.floor(ref.getMonth() / 3) * 3
      const start = new Date(ref.getFullYear(), quarterStartMonth, 1)
      return { start_date: iso(start), end_date: endOfToday }
    }

    case 'Half-Yearly': {
      const halfStartMonth = ref.getMonth() < 6 ? 0 : 6
      const start = new Date(ref.getFullYear(), halfStartMonth, 1)
      return { start_date: iso(start), end_date: endOfToday }
    }

    case 'Yearly': {
      const start = new Date(ref.getFullYear(), 0, 1)
      return { start_date: iso(start), end_date: endOfToday }
    }

    case 'Custom Date Range':
      // Caller must supply their own start_date/end_date via the Date Range
      // Picker — this function intentionally does not override them.
      return null

    default:
      return null
  }
}
