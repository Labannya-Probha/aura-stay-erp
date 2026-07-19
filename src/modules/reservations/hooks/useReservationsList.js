import {
  useCallback,
  useEffect,
  useState,
} from "react"

import { getReservationsRegister } from "../services/reservationsList.service"
import { normalizeReservationListRow } from "../reservation-list/normalizeReservationListRow"
import { useReservationRealtime } from "./useReservationRealtime"

export function useReservationsList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    setError("")

    try {
      const reservations = await getReservationsRegister()
      setRows(reservations.map(normalizeReservationListRow))
      setLastUpdatedAt(new Date())
    } catch (loadError) {
      console.error("Reservations register load failed:", loadError)
      setRows([])
      setError(loadError?.message || "Reservations could not be loaded.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const realtime = useReservationRealtime(
    () => load({ silent: true }),
    { debounceMs: 300 }
  )

  useEffect(() => {
    const handleRecovery = () => load({ silent: true })
    const handleVisibility = () => {
      if (document.visibilityState === "visible") handleRecovery()
    }

    window.addEventListener("online", handleRecovery)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("online", handleRecovery)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [load])

  return {
    rows,
    loading,
    refreshing,
    error,
    lastUpdatedAt,
    realtimeStatus: realtime.status,
    isLive: realtime.isLive,
    refresh: () => load({ silent: true }),
  }
}
