import { enumerateNights } from "./dateMath"

function appliesToDate(rule, date) {
  if (rule.startDate && date < rule.startDate) return false
  if (rule.endDate && date > rule.endDate) return false
  if (Array.isArray(rule.daysOfWeek) && rule.daysOfWeek.length) {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay()
    if (!rule.daysOfWeek.includes(day)) return false
  }
  return true
}

export function priceStay({ checkIn, checkOut, baseRate, rules = [], occupancy = 0, guests = {} }) {
  const nights = enumerateNights(checkIn, checkOut)
  const breakdown = nights.map((date) => {
    let rate = Number(baseRate || 0)
    const appliedRules = []

    const eligible = rules
      .filter((rule) => rule.active !== false && appliesToDate(rule, date))
      .sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0))

    for (const rule of eligible) {
      const type = String(rule.adjustmentType || rule.adjustment_type || "FIXED").toUpperCase()
      const value = Number(rule.value || 0)
      if (rule.minOccupancy != null && occupancy < Number(rule.minOccupancy)) continue
      if (rule.maxOccupancy != null && occupancy > Number(rule.maxOccupancy)) continue

      if (type === "PERCENT") rate += rate * (value / 100)
      else if (type === "FIXED") rate += value
      else if (type === "SET") rate = value
      appliedRules.push(rule.code || rule.name || "RATE_RULE")
    }

    const extraAdults = Math.max(0, Number(guests.adults || 0) - Number(guests.includedAdults ?? 2))
    const extraChildren = Math.max(0, Number(guests.children || 0) - Number(guests.includedChildren ?? 0))
    rate += extraAdults * Number(guests.extraAdultRate || 0)
    rate += extraChildren * Number(guests.extraChildRate || 0)

    return { date, rate: Math.max(0, Number(rate.toFixed(2))), appliedRules }
  })

  const roomTotal = breakdown.reduce((sum, night) => sum + night.rate, 0)
  const discount = Math.max(0, Number(guests.discount || 0))
  const netTotal = Math.max(0, roomTotal - discount)
  return {
    nights: breakdown.length,
    breakdown,
    roomTotal: Number(roomTotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    netTotal: Number(netTotal.toFixed(2)),
    averageNightlyRate: breakdown.length ? Number((netTotal / breakdown.length).toFixed(2)) : 0,
  }
}
