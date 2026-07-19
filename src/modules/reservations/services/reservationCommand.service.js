import { supabase } from "../../../lib/supabase"
import { withTenantInsert, withTenantScope } from "../../../lib/companySettings"
import { assertReservationTransition, normalizeReservationStatus } from "../domain/reservationLifecycle"
import { validateReservationPayload } from "../domain/reservationValidator"

function ensureSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.")
}

export async function createReservation(input, { status = "PENDING" } = {}) {
  ensureSupabase()
  const validation = validateReservationPayload(input)
  if (!validation.valid) {
    const error = new Error("Reservation validation failed.")
    error.validationErrors = validation.errors
    throw error
  }

  const value = validation.payload
  const record = withTenantInsert({
    reservation_name: value.reservationName,
    check_in: value.checkIn,
    check_out: value.checkOut,
    pax_adults: value.adults,
    pax_children: value.children,
    source: value.source,
    status: normalizeReservationStatus(status),
    notes: value.notes || null,
  })

  const { data, error } = await supabase
    .from("reservations")
    .insert(record)
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function updateReservationStatus(reservationId, nextStatus, currentStatus) {
  ensureSupabase()
  if (!reservationId) throw new Error("Reservation id is required.")

  const status = assertReservationTransition(currentStatus, nextStatus)
  const { data, error } = await withTenantScope(
    supabase
      .from("reservations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reservationId)
      .select("*")
  ).single()

  if (error) throw error
  return data
}

export async function cancelReservation(reservationId, currentStatus, reason) {
  ensureSupabase()
  const status = assertReservationTransition(currentStatus, "CANCELLED")
  const cancellationReason = String(reason || "").trim()
  if (!cancellationReason) throw new Error("Cancellation reason is required.")

  const { data, error } = await withTenantScope(
    supabase
      .from("reservations")
      .update({
        status,
        cancellation_reason: cancellationReason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)
      .select("*")
  ).single()

  if (error) throw error
  return data
}
