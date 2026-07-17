import { useCallback, useEffect, useState } from "react"
import {
  getArrivalBoard,
  getDepartureBoard,
  getFrontOfficeSummary,
  getInHouseGuests,
  getRoomRack,
} from "../services/frontOfficeService"

const EMPTY = {
  summary: {},
  arrivals: [],
  departures: [],
  inHouse: [],
  roomRack: [],
}

export function useFrontOfficeData() {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)

      setError("")

      const [summary, arrivals, departures, inHouse, roomRack] = await Promise.all([
        getFrontOfficeSummary(),
        getArrivalBoard(),
        getDepartureBoard(),
        getInHouseGuests(),
        getRoomRack(),
      ])

      setData({ summary, arrivals, departures, inHouse, roomRack })
    } catch (err) {
      console.error("Front office load failed:", err)
      setError(err?.message || "Front office data could not be loaded.")
      setData(EMPTY)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) load()
    })
    return () => {
      cancelled = true
    }
  }, [load])

  return {
    ...data,
    loading,
    refreshing,
    error,
    refresh: () => load({ silent: true }),
  }
}
