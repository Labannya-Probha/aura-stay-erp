import { useCallback, useEffect, useState } from "react"
import { DASHBOARD_DEFAULT_DATA } from "../types/dashboard.types"
import { getDashboardData } from "../services/dashboardService"
import { useDashboardRealtime } from "./useDashboardRealtime"

export function useDashboard({ realtime = true } = {}) {
  const [data, setData] = useState(DASHBOARD_DEFAULT_DATA)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)

      setError("")

      const nextData = await getDashboardData()

      setData({
        ...DASHBOARD_DEFAULT_DATA,
        ...nextData,
        summary: {
          ...DASHBOARD_DEFAULT_DATA.summary,
          ...(nextData.summary || {}),
        },
        housekeeping: {
          ...DASHBOARD_DEFAULT_DATA.housekeeping,
          ...(nextData.housekeeping || {}),
        },
        restaurant: {
          ...DASHBOARD_DEFAULT_DATA.restaurant,
          ...(nextData.restaurant || {}),
        },
      })
    } catch (err) {
      console.error("Dashboard load failed:", err)
      setError(err?.message || "Dashboard data could not be loaded.")
      setData(DASHBOARD_DEFAULT_DATA)
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

  useDashboardRealtime({
    enabled: realtime,
    onChange: () => load({ silent: true }),
  })

  return {
    loading,
    refreshing,
    error,
    ...data,
    refresh: () => load({ silent: true }),
  }
}
