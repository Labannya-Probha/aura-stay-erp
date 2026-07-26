function firstDefined(values, fallback = "") {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return value
    }
  }

  return fallback
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0

  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  const milliseconds = end.getTime() - start.getTime()

  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return 0
  }

  return Math.ceil(milliseconds / 86_400_000)
}

function roomLabels(reservationRooms = []) {
  return reservationRooms
    .map((assignment) => {
      const room = assignment.rooms
      if (!room) return null

      const number = room.room_no || "—"
      const name = room.room_name

      return name ? `${number} (${name})` : number
    })
    .filter(Boolean)
}

export function normalizeReservationListRow(reservation) {
  const guest = reservation.guests || {}
  const rooms = roomLabels(reservation.reservation_rooms)
  const adults = Number(reservation.pax_adults || 0)
  const children = Number(reservation.pax_children || 0)
  const nights = nightsBetween(
    reservation.check_in,
    reservation.check_out
  )

  const roomRate = Number(reservation.room_rate || 0)
  const roomCount =
    Number(reservation.room_count || 0) ||
    rooms.length

  const estimatedRoomTotal =
    roomRate > 0
      ? roomRate * Math.max(1, roomCount) * Math.max(1, nights)
      : 0

  const total = Number(
    firstDefined(
      [
        reservation.folio_total,
        reservation.grand_total,
        reservation.total_amount,
        estimatedRoomTotal,
      ],
      0
    )
  )

  const paid = Number(reservation.paid_total || 0)

  return {
    id: reservation.id,
    reservationNo: firstDefined(
      [
        reservation.res_no,
        reservation.reservation_no,
        reservation.booking_no,
      ],
      String(reservation.id || "").slice(0, 8)
    ),
    guestName: firstDefined(
      [
        reservation.reservation_name,
        guest.full_name,
      ],
      "—"
    ),
    customerId: guest.customer_id || "—",
    mobile: guest.phone || "—",
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    nights,
    roomNumber: rooms.join(", ") || "Not assigned",
    roomCount,
    pax: adults + children,
    source: reservation.source || "Direct",
    status: reservation.status || "PENDING",
    totalAmount: total,
    paidAmount: paid,
    dueAmount: Math.max(0, total - paid),
    createdAt: reservation.created_at,
  }
}
