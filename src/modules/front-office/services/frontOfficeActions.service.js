import { supabase } from "../../../supabase"
import { withTenantScope } from "../../../lib/companySettings"
import { computeCharge, eachNight, rateFor, todayISO } from "../../../lib/helpers"
import { resDiscount } from "../../../components/reservation/utils.js"
import { getTaxConfig } from "../../../lib/pms.api"

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
      .filter(
        (row) =>
          row.reservation_id !== excludeReservationId &&
          row.reservations?.status !== "CANCELLED"
      )
      .map((row) => row.room_id)
  )

  return (rooms || []).filter((room) => {
    const status = String(room.status || "").toUpperCase()
    const housekeeping = String(
      room.hk_status || ""
    ).toUpperCase()

    return (
      !blocked.has(room.id) &&
      ![
        "OOO",
        "OUT_OF_ORDER",
        "MAINTENANCE",
      ].includes(status) &&
      !["DIRTY", "INSPECTION"].includes(housekeeping)
    )
  })
}

export async function saveRegistrationCard(payload) {
  const { data, error } = await supabase
    .from("guest_registration_cards")
    .upsert(payload, {
      onConflict: "tenant_id,reservation_id",
    })
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function assignRoom({
  reservationId,
  roomId,
  checkIn,
  checkOut,
  rate,
}) {
  const { data: existing, error: existingError } =
    await withTenantScope(
      supabase
        .from("reservation_rooms")
        .select("id")
        .eq("reservation_id", reservationId)
        .eq("room_id", roomId)
        .maybeSingle()
    )

  if (existingError) throw existingError

  if (existing) {
    const { data, error } = await withTenantScope(
      supabase
        .from("reservation_rooms")
        .update({
          from_date: checkIn,
          to_date: checkOut,
          rate: Number(rate || 0),
        })
        .eq("id", existing.id)
        .select("*")
        .single()
    )

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from("reservation_rooms")
    .insert({
      reservation_id: reservationId,
      room_id: roomId,
      from_date: checkIn,
      to_date: checkOut,
      rate: Number(rate || 0),
    })
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function createDeposit({
  reservationId,
  amount,
  method,
  reference,
  receivedBy,
  notes,
}) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      reservation_id: reservationId,
      amount: Number(amount || 0),
      method,
      reference: reference || null,
      received_by: receivedBy || null,
      payment_class: "DEPOSIT",
      notes: notes || null,
    })
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function issueKeyCard({
  reservationId,
  roomId,
  cardNumber,
  issuedBy,
  expiresAt,
  vendor,
}) {
  const { data, error } = await supabase
    .from("key_card_logs")
    .insert({
      reservation_id: reservationId,
      room_id: roomId,
      card_number: cardNumber,
      issued_by: issuedBy || null,
      expires_at: expiresAt || null,
      vendor: vendor || "MANUAL",
      status: "ACTIVE",
    })
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function checkInReservation({
  reservationId,
  userName,
}) {
  const { data, error } = await supabase.rpc(
    "front_office_check_in",
    {
      p_reservation_id: reservationId,
      p_user_name: userName || null,
    }
  )

  if (error) throw error

  // Auto-post tonight's ROOM charge — replaces the manual "Post Room
  // Charges" step. Subsequent nights are still posted by the recurring
  // Night Audit process as the stay progresses; this only covers the
  // night that begins right now, at check-in.
  try {
    await postTonightsRoomCharge({ reservationId, userName })
  } catch (chargeErr) {
    // Never let a charge-posting hiccup block the physical check-in —
    // staff can always post/repost room charges manually from
    // Front Office → Billings & Check-out if this silently fails.
    console.warn("Auto room-charge post failed at check-in:", chargeErr)
  }

  return data
}

async function postTonightsRoomCharge({ reservationId, userName }) {
  const night = todayISO()

  const { data: res, error: resErr } = await withTenantScope(
    supabase
      .from("reservations")
      .select("id, check_in, check_out, discount_type, discount_val, discount_pct, extra_pax, extra_pax_rate, driver_accommodation, driver_count, driver_rate")
      .eq("id", reservationId)
  ).single()
  if (resErr || !res) return

  // Already posted for tonight? Don't duplicate (handles retries / repeat calls).
  const { data: existing } = await withTenantScope(
    supabase
      .from("folio_charges")
      .select("id")
      .eq("reservation_id", reservationId)
      .eq("charge_type", "ROOM")
      .eq("charge_date", night)
  )
  if (existing && existing.length > 0) return

  const { data: resRooms } = await withTenantScope(
    supabase
      .from("reservation_rooms")
      .select("room_id, rate, from_date, to_date, rooms(room_no, room_name)")
      .eq("reservation_id", reservationId)
  )
  if (!resRooms || resRooms.length === 0) return

  const { data: taxConfig } = await getTaxConfig()

  const discDescriptor = resDiscount(res)
  const totalRoomNights = resRooms.reduce((sum, rr) => {
    const ci = rr.from_date || res.check_in
    const co = rr.to_date || res.check_out
    return sum + eachNight(ci, co).length
  }, 0)
  const perNightDiscount = discDescriptor && typeof discDescriptor === "object" && totalRoomNights > 0
    ? { type: "fixed", value: discDescriptor.value / totalRoomNights }
    : discDescriptor
  const addonDiscount = discDescriptor && typeof discDescriptor === "object" ? 0 : discDescriptor

  const rows = []
  for (const rr of resRooms) {
    const ci = rr.from_date || res.check_in
    const co = rr.to_date || res.check_out
    if (night < ci || night >= co) continue // tonight isn't part of this room's window
    const rate = rateFor(taxConfig, "ROOM", night)
    rows.push({
      reservation_id: reservationId, charge_date: night, charge_type: "ROOM",
      description: `Room ${rr.rooms?.room_no}${rr.rooms?.room_name ? ` (${rr.rooms.room_name})` : ""} — Night of ${night}`,
      ...computeCharge(rr.rate, perNightDiscount, rate), created_by: userName || "system",
    })
  }

  if (night >= res.check_in && night < res.check_out) {
    const rate = rateFor(taxConfig, "ROOM", night)
    if (res.extra_pax > 0 && res.extra_pax_rate > 0)
      rows.push({ reservation_id: reservationId, charge_date: night, charge_type: "ROOM", description: `Extra pax × ${res.extra_pax} — ${night}`, ...computeCharge(res.extra_pax * res.extra_pax_rate, addonDiscount, rate), created_by: userName || "system" })
    if (res.driver_accommodation && res.driver_count > 0 && res.driver_rate > 0)
      rows.push({ reservation_id: reservationId, charge_date: night, charge_type: "ROOM", description: `Driver accommodation × ${res.driver_count} — ${night}`, ...computeCharge(res.driver_count * res.driver_rate, addonDiscount, rate), created_by: userName || "system" })
  }

  if (rows.length === 0) return
  await supabase.from("folio_charges").insert(rows)
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

export async function checkOutReservation({
  reservationId,
  userName,
}) {
  const { data, error } = await supabase.rpc(
    "front_office_check_out",
    {
      p_reservation_id: reservationId,
      p_user_name: userName || null,
    }
  )

  if (error) throw error
  return data
}
