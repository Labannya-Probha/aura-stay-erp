import { supabase } from "../../../supabase"

export async function getReservationKpis() {
  const { data, error } = await supabase.rpc("reservation_kpis")
  if (error) {
    console.warn("reservation_kpis failed:", error.message)
    return {}
  }
  return data || {}
}

export async function getReservationsList(filters = {}) {
  const { data, error } = await supabase.rpc("reservation_list", { p_filters: filters })
  if (error) {
    console.warn("reservation_list failed:", error.message)
    return []
  }
  return Array.isArray(data) ? data : []
}
