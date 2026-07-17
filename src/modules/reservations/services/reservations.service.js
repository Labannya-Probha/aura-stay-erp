import { supabase } from "../../../supabase"
import { runSingleFlight } from "../../../lib/singleFlight"

export async function getReservationKpis() {
  return runSingleFlight("reservations:kpis", async () => {
    const { data, error } = await supabase.rpc("reservation_kpi_summary")

  if (error) {
    console.warn("reservation_kpi_summary failed:", error.message)
    return {
      arrivals: 0,
      departures: 0,
      inHouse: 0,
      pendingPayments: 0,
    }
  }

    return data || {
      arrivals: 0,
      departures: 0,
      inHouse: 0,
      pendingPayments: 0,
    }
  })
}
