import { useCallback, useEffect, useState } from "react"
import { getBookingCalendarData } from "../services/bookingCalendarService"

const EMPTY_DATA = {
  rooms: [],
  reservations: [],
  kpis: {},
}

export function useBookingEngine({ days, filters }) {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setError("")

      const result = await getBookingCalendarData({
        startDate: days[0]?.iso,
        endDate: days[days.length - 1]?.iso,
        filters,
      })

      setData({
        ...EMPTY_DATA,
        ...result,
      })
    } catch (err) {
      console.error("Booking calendar load failed:", err)
      setError(err?.message || "Booking calendar could not be loaded.")
      setData(EMPTY_DATA)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [days, filters])

  useEffect(() => {
    setTimeout(() => {
      load()
    }, 0)
  }, [load])

  return {
    loading,
    refreshing,
    error,
    rooms: data.rooms,
    reservations: data.reservations,
    kpis: data.kpis,
    refresh: () => load({ silent: true }),
  }
}
