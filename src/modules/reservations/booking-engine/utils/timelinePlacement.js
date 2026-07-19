export function getReservationGridPlacement(
  reservation,
  days
) {
  if (
    !reservation?.checkIn ||
    !reservation?.checkOut ||
    !days?.length
  ) {
    return null
  }

  const checkIn = toUtcDay(reservation.checkIn)
  const checkOutExclusive = toUtcDay(
    reservation.checkOut
  )

  const calendarStart = toUtcDay(days[0].iso)
  const calendarEndExclusive =
    addUtcDays(
      toUtcDay(days.at(-1).iso),
      1
    )

  if (
    checkOutExclusive <= calendarStart ||
    checkIn >= calendarEndExclusive
  ) {
    return null
  }

  const visibleStart =
    checkIn < calendarStart
      ? calendarStart
      : checkIn

  const visibleEndExclusive =
    checkOutExclusive > calendarEndExclusive
      ? calendarEndExclusive
      : checkOutExclusive

  const startIndex = differenceInDays(
    visibleStart,
    calendarStart
  )

  const span = Math.max(
    1,
    differenceInDays(
      visibleEndExclusive,
      visibleStart
    )
  )

  return {
    startIndex,
    span,
    nights: differenceInDays(
      checkOutExclusive,
      checkIn
    ),
  }
}

function toUtcDay(value) {
  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number)

  return new Date(Date.UTC(year, month - 1, day))
}

function addUtcDays(date, amount) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

function differenceInDays(later, earlier) {
  return Math.round(
    (later.getTime() - earlier.getTime()) /
      86_400_000
  )
}
