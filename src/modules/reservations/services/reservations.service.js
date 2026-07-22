import { supabase } from "../../../lib/supabase"

const EMPTY_KPIS = {
  arrivals: 0,
  departures: 0,
  inHouse: 0,
  pendingPayments: 0,
}

export async function getReservationKpis() {
  if (!supabase) throw new Error("Supabase is not configured.")

  const { data, error } = await supabase.rpc("reservation_kpi_summary")

  if (error) {
    console.warn("reservation_kpi_summary failed:", error.message)
    return EMPTY_KPIS
  }

  return { ...EMPTY_KPIS, ...(data || {}) }
}
