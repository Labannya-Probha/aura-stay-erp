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
  const difference = end.getTime() - start.getTime()

  if (!Number.isFinite(difference) || difference <= 0) {
    return 0
  }

  return Math.ceil(difference / 86_400_000)
}

function assignedRoomLabels(assignments = []) {
  return assignments
    .map((assignment) => {
      const room = assignment.rooms
      if (!room) return null

      const roomNumber = room.room_no || "—"
      const roomName = room.room_name

      return roomName
        ? `${roomNumber} · ${roomName}`
        : roomNumber
    })
    .filter(Boolean)
}

export function normalizeReservationListRow(reservation) {
  const guest = reservation.guests || {}
  const assignments = Array.isArray(
    reservation.reservation_rooms
  )
    ? reservation.reservation_rooms
    : []

  const rooms = assignedRoomLabels(assignments)
  const total = Number(reservation.folio_total || 0)
  const paid = Number(reservation.paid_total || 0)

  return {
    id: reservation.id,
    reservationNo: firstDefined(
      [reservation.res_no],
      String(reservation.id || "").slice(0, 8)
    ),
    guestName: firstDefined(
      [
        reservation.reservation_name,
        guest.full_name,
      ],
      "Guest name not recorded"
    ),
    customerId: guest.customer_id || "—",
    mobile: guest.phone || "—",
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    nights: nightsBetween(
      reservation.check_in,
      reservation.check_out
    ),
    roomNumber: rooms.join(", ") || "Not assigned",
    roomCount: assignments.length,
    pax:
      Number(reservation.pax_adults || 0) +
      Number(reservation.pax_children || 0),
    source: reservation.source || "Direct",
    status: reservation.status || "PENDING",
    totalAmount: total,
    paidAmount: paid,
    dueAmount: Math.max(0, total - paid),
    createdAt: reservation.created_at,
  }
}
