import { useEffect, useState } from "react"
import { getReservationKpis } from "../services/reservations.service"

const DEFAULT_KPIS = {
  arrivals: 0,
  departures: 0,
  inHouse: 0,
  pendingPayments: 0,
}

export function useReservationKpis() {
  const [data, setData] = useState(DEFAULT_KPIS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.resolve().then(async () => {
      const next = await getReservationKpis()
      if (!active) return
      setData({ ...DEFAULT_KPIS, ...next })
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  return { data, loading }
}
