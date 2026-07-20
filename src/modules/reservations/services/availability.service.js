import { supabase } from "../../../lib/supabase"
import { getTenantId } from "../../../lib/tenant"

export async function fetchAvailability({ checkIn, checkOut, roomTypeId = null, quantity = 1 }) {
  if (!supabase) throw new Error("Supabase is not configured.")
  const tenantId = getTenantId()
  const { data, error } = await supabase.rpc("reservation_availability", {
    p_tenant_id: tenantId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_room_type_id: roomTypeId,
    p_quantity: Number(quantity || 1),
  })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function fetchRateQuote(payload) {
  if (!supabase) throw new Error("Supabase is not configured.")
  const { data, error } = await supabase.rpc("reservation_rate_quote", {
    p_tenant_id: getTenantId(),
    p_room_type_id: payload.roomTypeId,
    p_rate_plan_id: payload.ratePlanId || null,
    p_check_in: payload.checkIn,
    p_check_out: payload.checkOut,
    p_adults: Number(payload.adults || 1),
    p_children: Number(payload.children || 0),
    p_promo_code: payload.promoCode || null,
  })
  if (error) throw error
  return data || null
}

export async function allocateReservationRooms({ reservationId, roomIds, checkIn, checkOut, rate }) {
  if (!supabase) throw new Error("Supabase is not configured.")
  const { data, error } = await supabase.rpc("allocate_reservation_rooms", {
    p_tenant_id: getTenantId(),
    p_reservation_id: reservationId,
    p_room_ids: roomIds,
    p_from_date: checkIn,
    p_to_date: checkOut,
    p_rate: Number(rate || 0),
  })
  if (error) throw error
  return data
}
