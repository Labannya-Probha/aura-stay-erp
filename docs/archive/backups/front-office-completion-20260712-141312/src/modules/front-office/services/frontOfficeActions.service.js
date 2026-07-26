import { supabase } from "../../../lib/supabase"
import { withTenantScope } from "../../../lib/companySettings"

export async function getAvailableRooms({
  checkIn,
  checkOut,
  excludeReservationId,
}) {
  const { data: rooms, error } = await withTenantScope(
    supabase
      .from("rooms")
      .select("*")
      .eq("is_active", true)
      .order("room_no")
  )

  if (error) throw error

  const { data: assignments, error: assignmentError } =
    await withTenantScope(
      supabase
        .from("reservation_rooms")
        .select(`
          id,
          room_id,
          reservation_id,
          from_date,
          to_date,
          reservations!inner(
            id,
            status,
            check_in,
            check_out
          )
        `)
        .lte("from_date", checkOut)
        .gte("to_date", checkIn)
    )

  if (assignmentError) throw assignmentError

  const blocked = new Set(
    (assignments || [])
      .filter((row) =>
        row.reservation_id !== excludeReservationId &&
        row.reservations?.status !== "CANCELLED"
      )
      .map((row) => row.room_id)
  )

  return (rooms || []).filter((room) => {
    const status = String(room.status || "").toUpperCase()
    const hk = String(room.hk_status || "").toUpperCase()

    return (
      !blocked.has(room.id) &&
      !["OOO", "OUT_OF_ORDER", "MAINTENANCE"].includes(status) &&
      !["DIRTY", "INSPECTION"].includes(hk)
    )
  })
}

export async function moveRoom({
  reservationId,
  assignmentId,
  oldRoomId,
  newRoomId,
  fromDate,
  toDate,
  rate,
  userName,
  reason,
}) {
  const { data, error } = await supabase.rpc(
    "front_office_room_move",
    {
      p_reservation_id: reservationId,
      p_assignment_id: assignmentId,
      p_old_room_id: oldRoomId,
      p_new_room_id: newRoomId,
      p_from_date: fromDate,
      p_to_date: toDate,
      p_rate: Number(rate || 0),
      p_user_name: userName || null,
      p_reason: reason || null,
    }
  )

  if (error) throw error
  return data
}

export async function amendStay({
  reservationId,
  newCheckIn,
  newCheckOut,
  userName,
  reason,
}) {
  const { data, error } = await supabase.rpc(
    "front_office_amend_stay",
    {
      p_reservation_id: reservationId,
      p_new_check_in: newCheckIn,
      p_new_check_out: newCheckOut,
      p_user_name: userName || null,
      p_reason: reason || null,
    }
  )

  if (error) throw error
  return data
}
