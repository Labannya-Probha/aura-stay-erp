import { enumerateNights, rangesOverlap } from "./dateMath"

const BLOCKING_STATUSES = new Set([
  "HOLD", "PENDING", "CONFIRMED", "GUARANTEED", "CHECKED_IN", "IN_HOUSE",
])

export function normalizeInventoryLimit({ physicalRooms = 0, outOfOrder = 0, overbookingLimit = 0 }) {
  return Math.max(0, Number(physicalRooms || 0) - Number(outOfOrder || 0) + Number(overbookingLimit || 0))
}

function nextDate(value) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function calculateAvailability({
  checkIn,
  checkOut,
  roomTypes = [],
  reservations = [],
  outOfOrder = [],
  overbookingRules = [],
}) {
  const nights = enumerateNights(checkIn, checkOut)
  if (!nights.length) return []

  return roomTypes.map((roomType) => {
    const roomTypeId = roomType.id
    const physicalRooms = Number(roomType.roomCount ?? roomType.room_count ?? 0)
    const restriction = overbookingRules.find((rule) => rule.roomTypeId === roomTypeId || rule.room_type_id === roomTypeId)
    const overbookingLimit = Number(restriction?.limit ?? restriction?.overbooking_limit ?? 0)

    const daily = nights.map((date) => {
      const blockedRooms = outOfOrder.filter((entry) =>
        (entry.roomTypeId === roomTypeId || entry.room_type_id === roomTypeId) &&
        rangesOverlap(entry.fromDate ?? entry.from_date, entry.toDate ?? entry.to_date, date, nextDate(date))
      ).length

      const sold = reservations.reduce((total, reservation) => {
        const status = String(reservation.status || "").toUpperCase()
        if (!BLOCKING_STATUSES.has(status)) return total
        if ((reservation.roomTypeId ?? reservation.room_type_id) !== roomTypeId) return total
        if (!rangesOverlap(reservation.checkIn ?? reservation.check_in, reservation.checkOut ?? reservation.check_out, date, nextDate(date))) return total
        return total + Number(reservation.quantity ?? reservation.rooms ?? 1)
      }, 0)

      const sellable = normalizeInventoryLimit({ physicalRooms, outOfOrder: blockedRooms, overbookingLimit })
      return {
        date,
        physicalRooms,
        outOfOrder: blockedRooms,
        overbookingLimit,
        sellable,
        sold,
        available: Math.max(0, sellable - sold),
        oversold: Math.max(0, sold - sellable),
      }
    })

    return {
      roomTypeId,
      roomTypeName: roomType.name ?? roomType.room_type ?? "Room Type",
      daily,
      minimumAvailable: Math.min(...daily.map((day) => day.available)),
      totalOversold: daily.reduce((sum, day) => sum + day.oversold, 0),
      canSell: daily.every((day) => day.available > 0),
    }
  })
}
