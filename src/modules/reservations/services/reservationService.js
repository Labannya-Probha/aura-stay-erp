import { supabase } from "../../../lib/supabase"

export async function getReservationKpis() {
  if (!supabase) throw new Error("Supabase is not configured.")

  const { data, error } = await supabase.rpc("reservation_kpis")
  if (error) {
    console.warn("reservation_kpis failed:", error.message)
    return {}
  }
  return data || {}
}

export async function getReservationsList(filters = {}) {
  if (!supabase) throw new Error("Supabase is not configured.")

  const { data, error } = await supabase.rpc("reservation_list", { p_filters: filters })
  if (error) throw error
  return Array.isArray(data) ? data : []
}
