import { useCallback, useEffect, useState } from "react"
import { getReservationKpis } from "../services/reservations.service"
import { useReservationRealtime } from "./useReservationRealtime"

const DEFAULT_KPIS = {
  arrivals: 0,
  departures: 0,
  inHouse: 0,
  pendingPayments: 0,
}

export function useReservationKpis() {
  const [data, setData] = useState(DEFAULT_KPIS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")

    try {
      const next = await getReservationKpis()
      setData({ ...DEFAULT_KPIS, ...next })
    } catch (loadError) {
      setError(loadError?.message || "Reservation KPIs could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const realtime = useReservationRealtime(
    () => load({ silent: true }),
    { debounceMs: 350 }
  )

  return {
    data,
    loading,
    error,
    isLive: realtime.isLive,
    realtimeStatus: realtime.status,
    refresh: () => load({ silent: true }),
  }
}
