import { useCallback, useEffect, useRef, useState } from "react"
import { DASHBOARD_DEFAULT_DATA } from "../types/dashboard.types"
import { getDashboardData } from "../services/dashboardService"
import { useDashboardRealtime } from "./useDashboardRealtime"

function mergeDashboardData(nextData = {}) {
  return {
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
  }
}

export function useDashboard({ realtime = true, tenantId } = {}) {
  const [data, setData] = useState(DASHBOARD_DEFAULT_DATA)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState(null)
  const requestIdRef = useRef(0)
  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)
  const queuedSilentRef = useRef(null)

  useEffect(() => () => {
    mountedRef.current = false
  }, [])

  const load = useCallback(async ({ silent = false, showRefreshing = true } = {}) => {
    if (inFlightRef.current) {
      // Coalesce bursts of realtime events into a single follow-up refresh.
      queuedSilentRef.current = queuedSilentRef.current ?? silent
      return
    }

    inFlightRef.current = true
    const requestId = ++requestIdRef.current
    try {
      if (silent && showRefreshing) setRefreshing(true)
      else setLoading(true)
      setError("")

      const nextData = await getDashboardData({ tenantId })
      if (!mountedRef.current || requestId !== requestIdRef.current) return

      setData(mergeDashboardData(nextData))
      setLastUpdated(new Date())
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      console.error("Dashboard load failed:", err)
      setError(err?.message || "Dashboard data could not be loaded.")
    } finally {
      inFlightRef.current = false
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false)
        setRefreshing(false)
      }

      if (mountedRef.current && queuedSilentRef.current !== null) {
        const nextSilent = queuedSilentRef.current
        queuedSilentRef.current = null
        // Background follow-up keeps UI stable during realtime churn.
        void load({ silent: nextSilent, showRefreshing: false })
      }
    }
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  useDashboardRealtime({
    enabled: realtime,
    tenantId,
    onChange: () => load({ silent: true, showRefreshing: false }),
  })

  return {
    loading,
    refreshing,
    error,
    lastUpdated,
    isLive: Boolean(realtime),
    ...data,
    refresh: () => load({ silent: true, showRefreshing: true }),
  }
}

export { mergeDashboardData }
