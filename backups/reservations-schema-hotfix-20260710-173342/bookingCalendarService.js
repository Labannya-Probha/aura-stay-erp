import { supabase } from "../../../../lib/supabase"
import { withTenantScope } from "../../../../lib/companySettings"

export async function getBookingCalendarData({
  startDate,
  endDate,
  filters,
}) {
  const { data, error } = await supabase.rpc(
    "booking_calendar_data",
    {
      p_start_date: startDate,
      p_end_date: endDate,
      p_filters: filters || {},
    }
  )

  if (!error) {
    return {
      rooms: Array.isArray(data?.rooms) ? data.rooms : [],
      reservations: Array.isArray(data?.reservations)
        ? data.reservations
        : [],
      kpis: data?.kpis || {},
    }
  }

  console.warn(
    "booking_calendar_data failed; using direct query:",
    error.message
  )

  return loadBookingCalendarFallback({
    startDate,
    endDate,
    filters,
  })
}

function normalizeStatus(status) {
  if (!status) return "CONFIRMED"
  if (status === "QUERY" || status === "QUOTED") {
    return status
  }

  return status
}

function toRoomShape(room) {
  return {
    id: room.id,
    number: room.room_no || "—",
    name: room.room_name || "Room",
    type: room.room_name || "Room",
    floor: room.floor ?? null,
    status: room.status || null,
    rate: Number(room.rate || 0),
  }
}

function toReservationShape({
  reservation,
  assignment,
  room,
  paidReservationIds,
}) {
  const guest = reservation.guests || {}
  const guestName =
    reservation.reservation_name ||
    guest.full_name ||
    "Guest name not recorded"

  return {
    id: reservation.id,
    reservationNo:
      reservation.res_no ||
      String(reservation.id || "").slice(0, 8),
    roomId: room?.id || assignment.room_id,
    roomNumber: room?.number || "—",
    roomName: room?.name || "Room",
    guestName,
    guestPhone: guest.phone || "—",
    checkIn:
      assignment.from_date ||
      reservation.check_in,
    checkOut:
      assignment.to_date ||
      reservation.check_out,
    status: normalizeStatus(reservation.status),
    source: reservation.source || "Direct",
    advancePaid: paidReservationIds.has(reservation.id),
  }
}

function applyFilters(rooms, reservations, filters = {}) {
  const statusFilter = String(
    filters?.status || "ALL"
  ).toUpperCase()

  const roomTypeFilter = String(
    filters?.roomType || "ALL"
  ).toUpperCase()

  const search = String(
    filters?.search || ""
  )
    .trim()
    .toLowerCase()

  let visibleRooms = [...rooms]
  let visibleReservations = [...reservations]

  if (roomTypeFilter !== "ALL") {
    visibleRooms = visibleRooms.filter((room) =>
      `${room.name} ${room.type}`
        .toUpperCase()
        .includes(roomTypeFilter)
    )
  }

  const visibleRoomIds = new Set(
    visibleRooms.map((room) => room.id)
  )

  visibleReservations = visibleReservations.filter(
    (reservation) =>
      visibleRoomIds.has(reservation.roomId)
  )

  if (statusFilter !== "ALL") {
    visibleReservations = visibleReservations.filter(
      (reservation) =>
        String(reservation.status).toUpperCase() ===
        statusFilter
    )
  }

  if (search) {
    visibleReservations = visibleReservations.filter(
      (reservation) =>
        [
          reservation.reservationNo,
          reservation.guestName,
          reservation.guestPhone,
          reservation.roomNumber,
          reservation.roomName,
          reservation.source,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search)
    )
  }

  return {
    rooms: visibleRooms,
    reservations: visibleReservations,
  }
}

function buildKpis(rooms, reservations, startDate, endDate) {
  const totalRooms = rooms.length
  const occupiedRoomIds = new Set(
    reservations
      .filter((reservation) =>
        [
          "CONFIRMED",
          "CHECKED_IN",
          "CHECKED_OUT",
          "SETTLED",
          "QUERY",
          "QUOTED",
        ].includes(reservation.status)
      )
      .map((reservation) => reservation.roomId)
  )

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const dayCount = Math.max(
    1,
    Math.round(
      (end.getTime() - start.getTime()) / 86_400_000
    ) + 1
  )

  const bookedNights = reservations.reduce(
    (total, reservation) => {
      const checkIn = new Date(
        `${reservation.checkIn}T00:00:00`
      )
      const checkOut = new Date(
        `${reservation.checkOut}T00:00:00`
      )

      return (
        total +
        Math.max(
          1,
          Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) /
              86_400_000
          )
        )
      )
    },
    0
  )

  const roomNights = totalRooms * dayCount

  return {
    availableRooms: Math.max(
      totalRooms - occupiedRoomIds.size,
      0
    ),
    occupiedRooms: occupiedRoomIds.size,
    roomNights,
    bookedNights,
    occupancy:
      roomNights > 0
        ? Number(
            ((bookedNights / roomNights) * 100).toFixed(1)
          )
        : 0,
  }
}

async function loadBookingCalendarFallback({
  startDate,
  endDate,
  filters,
}) {
  const [
    { data: roomRows, error: roomError },
    { data: assignmentRows, error: assignmentError },
  ] = await Promise.all([
    withTenantScope(
      supabase
        .from("rooms")
        .select(
          "id,room_no,room_name,status,is_active,rate,floor"
        )
        .eq("is_active", true)
        .order("room_no")
    ),
    withTenantScope(
      supabase
        .from("reservation_rooms")
        .select(`
          id,
          room_id,
          from_date,
          to_date,
          rooms(
            id,
            room_no,
            room_name,
            status,
            rate,
            floor
          ),
          reservations!inner(
            id,
            res_no,
            reservation_name,
            status,
            source,
            check_in,
            check_out,
            guests:primary_guest_id(
              full_name,
              phone
            )
          )
        `)
        .lte("from_date", endDate)
        .gte("to_date", startDate)
        .not(
          "reservations.status",
          "eq",
          "CANCELLED"
        )
    ),
  ])

  if (roomError || assignmentError) {
    throw roomError || assignmentError
  }

  const reservationIds = [
    ...new Set(
      (assignmentRows || [])
        .map((row) => row.reservations?.id)
        .filter(Boolean)
    ),
  ]

  let paidReservationIds = new Set()

  if (reservationIds.length > 0) {
    const { data: paymentRows, error: paymentError } =
      await withTenantScope(
        supabase
          .from("payments")
          .select("reservation_id")
          .in("reservation_id", reservationIds)
      )

    if (!paymentError) {
      paidReservationIds = new Set(
        (paymentRows || []).map(
          (payment) => payment.reservation_id
        )
      )
    }
  }

  const rooms = (roomRows || []).map(toRoomShape)

  const reservations = (assignmentRows || [])
    .filter(
      (assignment) =>
        assignment.reservations &&
        assignment.rooms
    )
    .map((assignment) =>
      toReservationShape({
        reservation: assignment.reservations,
        assignment,
        room: toRoomShape(assignment.rooms),
        paidReservationIds,
      })
    )

  const filtered = applyFilters(
    rooms,
    reservations,
    filters
  )

  return {
    rooms: filtered.rooms,
    reservations: filtered.reservations,
    kpis: buildKpis(
      filtered.rooms,
      filtered.reservations,
      startDate,
      endDate
    ),
  }
}
