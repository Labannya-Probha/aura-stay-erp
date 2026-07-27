export function summarizeGuestHistory(reservations = [], charges = []) {
  const reservationList = Array.isArray(reservations) ? reservations : []
  const chargeList = Array.isArray(charges) ? charges : []

  const chargeMap = chargeList.reduce((acc, charge) => {
    const reservationId = charge?.reservation_id
    if (!reservationId) return acc
    acc[reservationId] = (acc[reservationId] || 0) + Number(charge?.total || 0)
    return acc
  }, {})

  const normalized = reservationList
    .map((reservation) => ({
      ...reservation,
      total_spend: chargeMap[reservation.id] || 0,
    }))
    .sort((a, b) => (b.check_in || '').localeCompare(a.check_in || ''))

  const bookingCount = normalized.length
  const totalSpend = normalized.reduce(
    (sum, reservation) => sum + Number(reservation.total_spend || 0),
    0,
  )
  const lastStays = normalized.filter((reservation) => reservation.check_in)
  const lastStayDate = lastStays[0]?.check_in || null
  const activeStays = normalized.filter((reservation) =>
    ['CHECKED_IN', 'CONFIRMED', 'IN_HOUSE'].includes(reservation.status),
  ).length

  return {
    booking_count: bookingCount,
    total_spend: totalSpend,
    last_stay_date: lastStayDate,
    active_stays: activeStays,
    reservations: normalized,
  }
}
