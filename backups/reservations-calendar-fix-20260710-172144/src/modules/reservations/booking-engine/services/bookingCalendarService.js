import { supabase } from "../../../../lib/supabase"

export async function getBookingCalendarData({ startDate, endDate, filters }) {
  const { data, error } = await supabase.rpc("booking_calendar_data", {
    p_start_date: startDate,
    p_end_date: endDate,
    p_filters: filters || {},
  })

  if (error) {
    console.warn("booking_calendar_data failed:", error.message)
    return loadBookingCalendarFallback({ startDate, endDate, filters })
  }

  return {
    rooms: Array.isArray(data?.rooms) ? data.rooms : [],
    reservations: Array.isArray(data?.reservations) ? data.reservations : [],
    kpis: data?.kpis || {},
  }
}

function normalizeStatus(status) {
  if (!status) return "CONFIRMED"
  if (status === "QUERY" || status === "QUOTED") return "TENTATIVE"
  if (status === "NO_SHOW") return "NO_SHOW"
  if (status === "CHECKED_IN") return "CHECKED_IN"
  if (status === "CANCELLED") return "CANCELLED"
  if (status === "BLOCKED") return "BLOCKED"
  return "CONFIRMED"
}

function toRoomShape(room) {
  return {
    id: room.id,
    number: room.room_no || room.room_number || room.name || "-",
    type: room.room_type || room.room_name || "Room",
    floor: room.floor ?? room.floor_no ?? null,
    status: room.status || null,
  }
}

function toReservationShape(row, roomRef) {
  const guestName = row.guests?.full_name || row.guest_name || row.reservation_name || "Guest"
  return {
    id: row.id,
    roomId: roomRef?.id || row.room_id || row.id,
    roomNumber: roomRef?.number || "-",
    guestName,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: normalizeStatus(row.status),
    source: row.source || "",
    balance: Number(row.balance_due || 0),
  }
}

function applyFilters(rooms, reservations, filters = {}) {
  const nextFilters = filters || {}
  const statusFilter = (nextFilters.status || "ALL").toUpperCase()
  const roomTypeFilter = (nextFilters.roomType || "ALL").toUpperCase()
  const floorFilter = String(nextFilters.floor || "ALL").toUpperCase()
  const search = (nextFilters.search || "").trim().toLowerCase()

  let nextRooms = [...rooms]
  let nextReservations = [...reservations]

  if (roomTypeFilter !== "ALL") {
    nextRooms = nextRooms.filter((room) => String(room.type || "").toUpperCase().includes(roomTypeFilter))
  }

  if (floorFilter !== "ALL") {
    nextRooms = nextRooms.filter((room) => String(room.floor ?? "").toUpperCase() === floorFilter)
  }

  const allowedRoomIds = new Set(nextRooms.map((room) => room.id))
  nextReservations = nextReservations.filter((reservation) => allowedRoomIds.has(reservation.roomId))

  if (statusFilter !== "ALL") {
    nextReservations = nextReservations.filter((reservation) => String(reservation.status || "").toUpperCase() === statusFilter)
  }

  if (search) {
    nextReservations = nextReservations.filter((reservation) => {
      const haystack = [
        reservation.guestName,
        reservation.roomNumber,
        reservation.source,
        reservation.id,
      ].join(" ").toLowerCase()
      return haystack.includes(search)
    })
  }

  return {
    rooms: nextRooms,
    reservations: nextReservations,
  }
}

function buildKpis(rooms, reservations) {
  const totalRooms = rooms.length
  const occupiedRooms = new Set(
    reservations
      .filter((reservation) => reservation.status === "CHECKED_IN")
      .map((reservation) => reservation.roomId)
  ).size

  const today = new Date().toISOString().slice(0, 10)
  const arrivals = reservations.filter((reservation) => reservation.checkIn === today).length
  const departures = reservations.filter((reservation) => reservation.checkOut === today).length
  const outOfOrder = rooms.filter((room) => ["OOO", "OUT_OF_ORDER"].includes(String(room.status || "").toUpperCase())).length
  const occupancy = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0

  return {
    availableRooms: Math.max(totalRooms - occupiedRooms, 0),
    occupiedRooms,
    arrivals,
    departures,
    outOfOrder,
    occupancy,
  }
}

async function loadBookingCalendarFallback({ startDate, endDate, filters }) {
  const [roomsRes, reservationsRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, room_no, room_number, name, room_name, room_type, floor, floor_no, status, is_active"),
    supabase
      .from("reservations")
      .select("id, room_id, reservation_name, guest_name, status, source, check_in, check_out, balance_due, guests:primary_guest_id(full_name), reservation_rooms(room_id, rooms(id, room_no, room_number, name, room_name, room_type, floor, floor_no, status))")
      .lte("check_in", endDate)
      .gte("check_out", startDate)
      .not("status", "eq", "CANCELLED"),
  ])

  if (roomsRes.error || reservationsRes.error) {
    console.warn("booking calendar fallback failed:", roomsRes.error?.message || reservationsRes.error?.message)
    return {
      rooms: [],
      reservations: [],
      kpis: {},
    }
  }

  const roomRows = (roomsRes.data || []).filter((room) => room.is_active !== false)
  const rooms = roomRows.map(toRoomShape)
  const roomById = new Map(rooms.map((room) => [room.id, room]))

  const reservations = []
  for (const reservation of reservationsRes.data || []) {
    const assignedRooms = Array.isArray(reservation.reservation_rooms) ? reservation.reservation_rooms : []
    if (assignedRooms.length > 0) {
      for (const assignedRoom of assignedRooms) {
        const roomRef = assignedRoom.rooms
          ? toRoomShape(assignedRoom.rooms)
          : (roomById.get(assignedRoom.room_id) || {
            id: assignedRoom.room_id,
            number: "-",
            type: "Room",
            floor: null,
            status: null,
          })
        reservations.push(toReservationShape(reservation, roomRef))
      }
      continue
    }

    const fallbackRoom = roomById.get(reservation.room_id)
    if (fallbackRoom) reservations.push(toReservationShape(reservation, fallbackRoom))
  }

  const filtered = applyFilters(rooms, reservations, filters)
  return {
    rooms: filtered.rooms,
    reservations: filtered.reservations,
    kpis: buildKpis(filtered.rooms, filtered.reservations),
  }
}
