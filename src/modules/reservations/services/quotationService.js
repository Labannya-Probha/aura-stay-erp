import { supabase } from "../../../supabase"
import {
  withTenantScope,
} from "../../../lib/companySettings"

export async function getReservationQuotation(
  reservationId
) {
  const { data, error } = await withTenantScope(
    supabase
      .from("quotations")
      .select("*")
      .eq("reservation_id", reservationId)
      .maybeSingle()
  )

  if (error) throw error
  return data
}

export async function updateReservationQuotation(
  reservationId,
  patch
) {
  const { data, error } = await withTenantScope(
    supabase
      .from("quotations")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("reservation_id", reservationId)
      .select("*")
      .single()
  )

  if (error) throw error
  return data
}
