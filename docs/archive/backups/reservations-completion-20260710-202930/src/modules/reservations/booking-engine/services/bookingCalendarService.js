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
    name: room.room_name || room.room_type || "Room",
    type: room.room_type || room.room_name || "Room",
    floor: room.floor ?? null,
    status: room.status || null,
    rate: Number(room.base_rate || 0),
  }
}

function toReservationShape({
  reservation,
  assignment,
  room,
  paidReservationIds,
}) {
  const guest = reservation.guests || {}

  return {
    id: reservation.id,
    reservationNo:
      reservation.res_no ||
      String(reservation.id || "").slice(0, 8),
    roomId: room?.id || assignment.room_id,
    roomNumber: room?.number || "—",
    roomName: room?.name || "Room",
    roomType: room?.type || "Room",
    guestName:
      reservation.reservation_name ||
      guest.full_name ||
      "Guest name not recorded",
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
    rate: Number(room?.rate || 0),
  }
}

function applyFilters(rooms, reservations, filters = {}) {
  const statusFilter = String(
    filters?.status || "ALL"
  ).toUpperCase()

  const roomTypeFilter = String(
    filters?.roomType || "ALL"
  ).toUpperCase()

  const floorFilter = String(
    filters?.floor || "ALL"
  ).toUpperCase()

  const search = String(filters?.search || "")
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

  if (floorFilter !== "ALL") {
    visibleRooms = visibleRooms.filter(
      (room) =>
        String(room.floor ?? "").toUpperCase() ===
        floorFilter
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
          reservation.roomType,
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

function buildKpis(rooms, reservations) {
  const totalRooms = rooms.length

  const occupiedRooms = new Set(
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
  ).size

  const today = new Date().toISOString().slice(0, 10)

  const arrivals = reservations.filter(
    (reservation) => reservation.checkIn === today
  ).length

  const departures = reservations.filter(
    (reservation) => reservation.checkOut === today
  ).length

  const outOfOrder = rooms.filter((room) =>
    ["OOO", "OUT_OF_ORDER"].includes(
      String(room.status || "").toUpperCase()
    )
  ).length

  return {
    availableRooms: Math.max(
      totalRooms - occupiedRooms,
      0
    ),
    occupiedRooms,
    arrivals,
    departures,
    outOfOrder,
    occupancy:
      totalRooms > 0
        ? Number(
            ((occupiedRooms / totalRooms) * 100).toFixed(1)
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
        .select("*")
        .eq("is_active", true)
        .order("room_no")
    ),
    withTenantScope(
      supabase
        .from("reservation_rooms")
        .select(`
          id,
          room_id,
          reservation_id,
          from_date,
          to_date,
          rooms(*),
          reservations!inner(
            id,
            res_no,
            reservation_name,
            status,
            source,
            check_in,
            check_out,
            primary_guest_id,
            guests:primary_guest_id(
              id,
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
      filtered.reservations
    ),
  }
}
