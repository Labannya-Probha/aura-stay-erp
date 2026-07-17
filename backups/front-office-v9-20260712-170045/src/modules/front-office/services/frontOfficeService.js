import { supabase } from "../../../supabase"
import { withTenantScope } from "../../../lib/companySettings"

function normalizeRoomAssignments(assignments = []) {
  return assignments
    .map((assignment) => {
      const room = assignment.rooms
      if (!room) return null

      return {
        assignmentId: assignment.id,
        roomId: room.id,
        id: room.id,
        number: room.room_no || "—",
        name: room.room_name || room.room_type || "Room",
        type: room.room_type || room.room_name || "Room",
        status: room.status || "—",
        housekeepingStatus:
          room.hk_status || room.status || "—",
        baseRate: Number(
          assignment.rate ?? room.base_rate ?? 0
        ),
        fromDate: assignment.from_date,
        toDate: assignment.to_date,
      }
    })
    .filter(Boolean)
}

function sumByReservation(rows, valueKey) {
  return (rows || []).reduce((summary, row) => {
    if (!row.reservation_id) return summary

    summary[row.reservation_id] =
      Number(summary[row.reservation_id] || 0) +
      Number(row[valueKey] || 0)

    return summary
  }, {})
}

function normalizeReservation(
  reservation,
  chargeTotals,
  paymentTotals
) {
  const guest = reservation.guests || {}
  const rooms = normalizeRoomAssignments(
    reservation.reservation_rooms
  )

  const total = Number(
    chargeTotals[reservation.id] || 0
  )

  const paid = Number(
    paymentTotals[reservation.id] || 0
  )

  return {
    id: reservation.id,
    reservationId: reservation.id,
    reservationNo:
      reservation.res_no ||
      String(reservation.id || "").slice(0, 8),
    guestName:
      reservation.reservation_name ||
      guest.full_name ||
      "Guest name not recorded",
    mobile: guest.phone || "—",
    customerId: guest.customer_id || "—",
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    roomNumber:
      rooms.map((room) => room.number).join(", ") ||
      "Not assigned",
    roomName:
      rooms.map((room) => room.name).join(", ") ||
      "Not assigned",
    roomType:
      rooms.map((room) => room.type).join(", ") ||
      "Not assigned",
    roomCount: rooms.length,
    source: reservation.source || "Direct",
    status: reservation.status || "PENDING",
    pax:
      Number(reservation.pax_adults || 0) +
      Number(reservation.pax_children || 0),
    total,
    paid,
    balance: Math.max(0, total - paid),
    notes: reservation.notes || "",
    rooms,
  }
}

async function loadReservations({
  checkIn,
  checkOut,
  statuses,
  limit = 1000,
} = {}) {
  let query = withTenantScope(
    supabase
      .from("reservations")
      .select(`
        id,
        res_no,
        reservation_name,
        primary_guest_id,
        status,
        source,
        check_in,
        check_out,
        pax_adults,
        pax_children,
        notes,
        created_at,
        guests:primary_guest_id(
          id,
          full_name,
          phone,
          customer_id
        ),
        reservation_rooms(
          id,
          room_id,
          from_date,
          to_date,
          rate,
          rooms(
            id,
            room_no,
            room_name,
            room_type,
            base_rate,
            status,
            hk_status
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)
  )

  if (checkIn) query = query.eq("check_in", checkIn)
  if (checkOut) query = query.eq("check_out", checkOut)
  if (statuses?.length) query = query.in("status", statuses)

  const { data: reservations, error } = await query
  if (error) throw error

  const reservationIds = (reservations || [])
    .map((reservation) => reservation.id)
    .filter(Boolean)

  if (!reservationIds.length) return []

  const [chargesResult, paymentsResult] =
    await Promise.all([
      withTenantScope(
        supabase
          .from("folio_charges")
          .select("reservation_id,total")
          .in("reservation_id", reservationIds)
      ),
      withTenantScope(
        supabase
          .from("payments")
          .select("reservation_id,amount")
          .in("reservation_id", reservationIds)
      ),
    ])

  const chargeTotals = sumByReservation(
    chargesResult.data,
    "total"
  )

  const paymentTotals = sumByReservation(
    paymentsResult.data,
    "amount"
  )

  return (reservations || []).map((reservation) =>
    normalizeReservation(
      reservation,
      chargeTotals,
      paymentTotals
    )
  )
}

export async function getArrivalBoard() {
  return loadReservations({
    checkIn: todayIso(),
    statuses: [
      "QUERY",
      "QUOTED",
      "CONFIRMED",
    ],
  })
}

export async function getDepartureBoard() {
  return loadReservations({
    checkOut: todayIso(),
    statuses: ["CHECKED_IN"],
  })
}

export async function getInHouseGuests() {
  return loadReservations({
    statuses: ["CHECKED_IN"],
  })
}

export async function getRoomRack() {
  const [roomResult, inHouse] = await Promise.all([
    withTenantScope(
      supabase
        .from("rooms")
        .select("*")
        .eq("is_active", true)
        .order("room_no")
    ),
    getInHouseGuests(),
  ])

  if (roomResult.error) throw roomResult.error

  const guestByRoom = new Map()

  for (const reservation of inHouse) {
    for (const room of reservation.rooms || []) {
      guestByRoom.set(room.roomId, reservation)
    }
  }

  return (roomResult.data || []).map((room) => {
    const reservation = guestByRoom.get(room.id)

    return {
      id: room.id,
      number: room.room_no || "—",
      name:
        room.room_name || room.room_type || "Room",
      type:
        room.room_type || room.room_name || "Room",
      baseRate: Number(room.base_rate || 0),
      status: room.status || "—",
      housekeepingStatus:
        room.hk_status || room.status || "—",
      guestName: reservation?.guestName || "Vacant",
      reservationNo:
        reservation?.reservationNo || "—",
      reservationId:
        reservation?.reservationId || null,
      checkOut: reservation?.checkOut || null,
      balance: Number(reservation?.balance || 0),
      occupied: Boolean(reservation),
    }
  })
}

export async function getFrontOfficeSummary() {
  const [arrivals, departures, inHouse, roomRack] =
    await Promise.all([
      getArrivalBoard(),
      getDepartureBoard(),
      getInHouseGuests(),
      getRoomRack(),
    ])

  return {
    arrivals: arrivals.length,
    departures: departures.length,
    inHouse: inHouse.length,
    availableRooms: roomRack.filter(
      (room) => !room.occupied
    ).length,
    dirtyRooms: roomRack.filter((room) =>
      ["DIRTY", "INSPECTION"].includes(
        String(room.housekeepingStatus).toUpperCase()
      )
    ).length,
    dueBalance: inHouse.reduce(
      (total, reservation) =>
        total + Number(reservation.balance || 0),
      0
    ),
  }
}

function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(
    2,
    "0"
  )
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
