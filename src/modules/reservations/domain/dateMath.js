export function toDateOnly(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export function enumerateNights(checkIn, checkOut) {
  const start = toDateOnly(checkIn)
  const end = toDateOnly(checkOut)
  if (!start || !end || end <= start) return []
  const cursor = new Date(`${start}T00:00:00Z`)
  const limit = new Date(`${end}T00:00:00Z`)
  const nights = []
  while (cursor < limit) {
    nights.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return nights
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const a1 = toDateOnly(aStart)
  const a2 = toDateOnly(aEnd)
  const b1 = toDateOnly(bStart)
  const b2 = toDateOnly(bEnd)
  if (!a1 || !a2 || !b1 || !b2) return false
  return a1 < b2 && b1 < a2
}
