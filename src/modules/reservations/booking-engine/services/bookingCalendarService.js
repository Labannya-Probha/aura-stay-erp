import { supabase } from "../../../../supabase"
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
      conflicts: Array.isArray(data?.conflicts)
        ? data.conflicts
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

function normalizeRoom(room) {
  return {
    id: room.id,
    number: room.room_no || "—",
    name: room.room_name || room.room_type || "Room",
    type: room.room_type || room.room_name || "Room",
    status: room.status || "Clean",
    housekeepingStatus: room.hk_status || room.status || "Clean",
    baseRate: Number(room.base_rate || 0),
  }
}

function normalizeReservation({
  assignment,
  reservation,
  room,
  paidReservationIds,
  roomCountByReservation,
}) {
  const guest = reservation.guests || {}

  return {
    id: `${reservation.id}:${assignment.id}`,
    reservationId: reservation.id,
    assignmentId: assignment.id,
    reservationNo:
      reservation.res_no ||
      String(reservation.id || "").slice(0, 8),
    roomId: room.id,
    roomNumber: room.number,
    roomName: room.name,
    roomType: room.type,
    roomRate: Number(
      assignment.rate ?? room.baseRate ?? 0
    ),
    guestName:
      reservation.reservation_name ||
      guest.full_name ||
      "Guest name not recorded",
    guestPhone: guest.phone || "—",
    customerId: guest.customer_id || "—",
    checkIn:
      assignment.from_date ||
      reservation.check_in,
    checkOut:
      assignment.to_date ||
      reservation.check_out,
    status: reservation.status || "CONFIRMED",
    source: reservation.source || "Direct",
    advancePaid: paidReservationIds.has(
      reservation.id
    ),
    roomCount:
      roomCountByReservation.get(reservation.id) || 1,
    pax:
      Number(reservation.pax_adults || 0) +
      Number(reservation.pax_children || 0),
  }
}

function applyFilters(
  rooms,
  reservations,
  filters = {}
) {
  const status = String(
    filters.status || "ALL"
  ).toUpperCase()

  const roomType = String(
    filters.roomType || "ALL"
  ).toUpperCase()

  const search = String(filters.search || "")
    .trim()
    .toLowerCase()

  let visibleRooms = [...rooms]
  let visibleReservations = [...reservations]

  if (roomType !== "ALL") {
    visibleRooms = visibleRooms.filter((room) =>
      `${room.name} ${room.type}`
        .toUpperCase()
        .includes(roomType)
    )
  }

  const visibleRoomIds = new Set(
    visibleRooms.map((room) => room.id)
  )

  visibleReservations = visibleReservations.filter(
    (reservation) =>
      visibleRoomIds.has(reservation.roomId)
  )

  if (status !== "ALL") {
    visibleReservations = visibleReservations.filter(
      (reservation) =>
        String(reservation.status).toUpperCase() === status
    )
  }

  if (search) {
    visibleReservations = visibleReservations.filter(
      (reservation) =>
        [
          reservation.reservationNo,
          reservation.guestName,
          reservation.guestPhone,
          reservation.customerId,
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

function findConflicts(reservations) {
  const conflicts = []

  const byRoom = reservations.reduce(
    (groups, reservation) => {
      const rows =
        groups.get(reservation.roomId) || []
      rows.push(reservation)
      groups.set(reservation.roomId, rows)
      return groups
    },
    new Map()
  )

  for (const [roomId, roomReservations] of byRoom) {
    const sorted = [...roomReservations].sort(
      (a, b) =>
        String(a.checkIn).localeCompare(
          String(b.checkIn)
        )
    )

    for (let index = 0; index < sorted.length; index += 1) {
      for (
        let compare = index + 1;
        compare < sorted.length;
        compare += 1
      ) {
        const first = sorted[index]
        const second = sorted[compare]

        const overlaps =
          first.checkIn < second.checkOut &&
          first.checkOut > second.checkIn

        if (!overlaps) break

        conflicts.push({
          roomId,
          roomNumber: first.roomNumber,
          firstReservationId: first.reservationId,
          secondReservationId: second.reservationId,
          firstReservationNo: first.reservationNo,
          secondReservationNo: second.reservationNo,
        })
      }
    }
  }

  return conflicts
}

function buildKpis(
  rooms,
  reservations,
  conflicts
) {
  const today = new Date()
    .toISOString()
    .slice(0, 10)

  const occupied = new Set(
    reservations
      .filter((reservation) =>
        [
          "CONFIRMED",
          "CHECKED_IN",
          "QUERY",
          "QUOTED",
        ].includes(reservation.status)
      )
      .map((reservation) => reservation.roomId)
  ).size

  return {
    availableRooms: Math.max(
      rooms.length - occupied,
      0
    ),
    occupiedRooms: occupied,
    arrivals: reservations.filter(
      (reservation) =>
        reservation.checkIn === today
    ).length,
    departures: reservations.filter(
      (reservation) =>
        reservation.checkOut === today
    ).length,
    outOfOrder: rooms.filter((room) =>
      ["OOO", "OUT_OF_ORDER", "MAINTENANCE"].includes(
        String(room.status).toUpperCase()
      )
    ).length,
    occupancy:
      rooms.length > 0
        ? Number(
            ((occupied / rooms.length) * 100).toFixed(1)
          )
        : 0,
    conflicts: conflicts.length,
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
          "id,room_no,room_name,room_type,base_rate,status,hk_status,is_active"
        )
        .eq("is_active", true)
        .order("room_no")
    ),
    withTenantScope(
      supabase
        .from("reservation_rooms")
        .select(`
          id,
          reservation_id,
          room_id,
          rate,
          from_date,
          to_date,
          rooms(
            id,
            room_no,
            room_name,
            room_type,
            base_rate,
            status,
            hk_status
          ),
          reservations!inner(
            id,
            res_no,
            reservation_name,
            status,
            source,
            check_in,
            check_out,
            pax_adults,
            pax_children,
            guests:primary_guest_id(
              full_name,
              phone,
              customer_id
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
        .map((row) => row.reservation_id)
        .filter(Boolean)
    ),
  ]

  let paidReservationIds = new Set()

  if (reservationIds.length > 0) {
    const { data: payments, error: paymentError } =
      await withTenantScope(
        supabase
          .from("payments")
          .select("reservation_id")
          .in("reservation_id", reservationIds)
      )

    if (!paymentError) {
      paidReservationIds = new Set(
        (payments || []).map(
          (payment) => payment.reservation_id
        )
      )
    }
  }

  const rooms = (roomRows || []).map(normalizeRoom)

  const roomCountByReservation = (
    assignmentRows || []
  ).reduce((map, assignment) => {
    map.set(
      assignment.reservation_id,
      (map.get(assignment.reservation_id) || 0) + 1
    )
    return map
  }, new Map())

  const reservations = (assignmentRows || [])
    .filter(
      (assignment) =>
        assignment.rooms &&
        assignment.reservations
    )
    .map((assignment) =>
      normalizeReservation({
        assignment,
        reservation: assignment.reservations,
        room: normalizeRoom(assignment.rooms),
        paidReservationIds,
        roomCountByReservation,
      })
    )

  const filtered = applyFilters(
    rooms,
    reservations,
    filters
  )

  const conflicts = findConflicts(
    filtered.reservations
  )

  return {
    rooms: filtered.rooms,
    reservations: filtered.reservations,
    conflicts,
    kpis: buildKpis(
      filtered.rooms,
      filtered.reservations,
      conflicts
    ),
  }
}

export async function moveReservationAssignment({
  assignmentId,
  reservationId,
  roomId,
  fromDate,
  toDate,
}) {
  const { data: overlaps, error: overlapError } =
    await withTenantScope(
      supabase
        .from("reservation_rooms")
        .select(`
          id,
          room_id,
          from_date,
          to_date,
          reservations!inner(
            id,
            check_in,
            check_out,
            status
          )
        `)
        .eq("room_id", roomId)
        .neq("id", assignmentId)
        .in("reservations.status", [
          "QUERY",
          "QUOTED",
          "CONFIRMED",
          "CHECKED_IN",
        ])
    )

  if (overlapError) throw overlapError

  const conflict = (overlaps || []).find((row) => {
    const existingFrom =
      row.from_date || row.reservations.check_in
    const existingTo =
      row.to_date || row.reservations.check_out

    return (
      existingFrom < toDate &&
      existingTo > fromDate
    )
  })

  if (conflict) {
    throw new Error(
      "The selected room already has an overlapping reservation."
    )
  }

  const { error: moveError } = await withTenantScope(
    supabase
      .from("reservation_rooms")
      .update({
        room_id: roomId,
        from_date: fromDate,
        to_date: toDate,
      })
      .eq("id", assignmentId)
  )

  if (moveError) throw moveError

  const { data: assignments, error: assignmentError } =
    await withTenantScope(
      supabase
        .from("reservation_rooms")
        .select("from_date,to_date")
        .eq("reservation_id", reservationId)
    )

  if (assignmentError) throw assignmentError

  const validAssignments = (assignments || []).filter(
    (row) => row.from_date && row.to_date
  )

  if (validAssignments.length > 0) {
    const checkIn = validAssignments
      .map((row) => row.from_date)
      .sort()[0]

    const checkOut = validAssignments
      .map((row) => row.to_date)
      .sort()
      .at(-1)

    const { error: reservationError } =
      await withTenantScope(
        supabase
          .from("reservations")
          .update({
            check_in: checkIn,
            check_out: checkOut,
          })
          .eq("id", reservationId)
      )

    if (reservationError) throw reservationError
  }

  return true
}
