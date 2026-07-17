import { useCallback, useEffect, useState } from "react"
import { getReservationsList } from "../services/reservationService"

export function useReservations(filters = {}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)

      setError("")
      const data = await getReservationsList(filters)
      setRows(data)
    } catch (err) {
      setError(err?.message || "Reservations could not be loaded.")
      setRows([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters])

  useEffect(() => {
    setTimeout(() => {
      load()
    }, 0)
  }, [load])

  return {
    rows,
    loading,
    refreshing,
    error,
    refresh: () => load({ silent: true }),
  }
}
