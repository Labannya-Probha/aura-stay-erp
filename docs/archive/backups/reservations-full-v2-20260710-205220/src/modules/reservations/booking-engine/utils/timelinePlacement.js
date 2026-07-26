export function getReservationGridPlacement(reservation, days) {
  if (!reservation?.checkIn || !reservation?.checkOut || !days?.length) return null

  const start = normalize(reservation.checkIn)
  const end = normalize(reservation.checkOut)

  const first = normalize(days[0].iso)
  const last = normalize(days[days.length - 1].iso)

  if (end < first || start > last) return null

  const visibleStart = start < first ? first : start
  const visibleEnd = end > last ? last : end

  const startIndex = days.findIndex((day) => normalize(day.iso) >= visibleStart)
  const endIndex = days.findIndex((day) => normalize(day.iso) >= visibleEnd)

  if (startIndex < 0) return null

  return {
    startIndex,
    span: Math.max((endIndex >= 0 ? endIndex : days.length - 1) - startIndex + 1, 1),
  }
}

function normalize(value) {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}
