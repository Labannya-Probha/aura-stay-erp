import {
  useCallback,
  useEffect,
  useState,
} from "react"

import { getReservationsRegister } from "../services/reservationsList.service"
import { normalizeReservationListRow } from "../reservation-list/normalizeReservationListRow"

export function useReservationsList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    setError("")

    try {
      const reservations = await getReservationsRegister()

      setRows(
        reservations.map(normalizeReservationListRow)
      )
    } catch (loadError) {
      console.error(
        "Reservations register load failed:",
        loadError
      )

      setRows([])
      setError(
        loadError?.message ||
          "Reservations could not be loaded."
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    rows,
    loading,
    refreshing,
    error,
    refresh: () => load({ silent: true }),
  }
}
