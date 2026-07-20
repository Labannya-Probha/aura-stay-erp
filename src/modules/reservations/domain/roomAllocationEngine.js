import { rangesOverlap } from "./dateMath"

export function rankRooms({ rooms = [], assignments = [], checkIn, checkOut, roomTypeId, preferences = {} }) {
  return rooms
    .filter((room) => room.is_active !== false)
    .filter((room) => !roomTypeId || room.room_type_id === roomTypeId || room.room_type === roomTypeId)
    .map((room) => {
      const conflict = assignments.some((assignment) =>
        assignment.room_id === room.id &&
        rangesOverlap(assignment.from_date, assignment.to_date, checkIn, checkOut) &&
        !["CANCELLED", "NO_SHOW"].includes(String(assignment.status || "").toUpperCase())
      )
      let score = conflict ? -10000 : 100
      if (["OOO", "OUT_OF_ORDER", "MAINTENANCE"].includes(String(room.status).toUpperCase())) score -= 5000
      if (preferences.floor != null && Number(room.floor) === Number(preferences.floor)) score += 20
      if (preferences.smoking != null && Boolean(room.is_smoking) === Boolean(preferences.smoking)) score += 10
      if (preferences.accessible && room.is_accessible) score += 30
      if (preferences.adjacentTo && room.adjacent_to === preferences.adjacentTo) score += 25
      return { ...room, conflict, allocationScore: score }
    })
    .sort((a, b) => b.allocationScore - a.allocationScore || String(a.room_no).localeCompare(String(b.room_no)))
}

export function selectBestRooms(args, quantity = 1) {
  const ranked = rankRooms(args)
  const available = ranked.filter((room) => !room.conflict && room.allocationScore > 0)
  return {
    selected: available.slice(0, Math.max(1, Number(quantity || 1))),
    alternatives: available.slice(Math.max(1, Number(quantity || 1))),
    insufficient: available.length < Math.max(1, Number(quantity || 1)),
  }
}
