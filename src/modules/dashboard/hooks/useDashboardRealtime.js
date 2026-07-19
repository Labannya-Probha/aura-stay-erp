import { useEffect, useRef } from "react"
import { supabase } from "../../../lib/supabase"

const WATCHED_TABLES = [
  "reservations",
  "rooms",
  "folio_charges",
  "payments",
  "requisitions",
  "notifications",
  "housekeeping_tasks",
]

export function useDashboardRealtime({
  enabled = true,
  tenantId,
  onChange,
  debounceMs = 450,
}) {
  const callbackRef = useRef(onChange)

  useEffect(() => {
    callbackRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!enabled || !supabase || typeof callbackRef.current !== "function") {
      return undefined
    }

    let timer = null
    let disposed = false

    const scheduleRefresh = () => {
      if (disposed) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => callbackRef.current?.(), debounceMs)
    }

    const channelName = `aeds-dashboard-${tenantId || "global"}-${Math.random()
      .toString(36)
      .slice(2, 8)}`
    const channel = supabase.channel(channelName)

    WATCHED_TABLES.forEach((table) => {
      const config = { event: "*", schema: "public", table }
      if (tenantId) config.filter = `tenant_id=eq.${tenantId}`
      channel.on("postgres_changes", config, scheduleRefresh)
    })

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") scheduleRefresh()
    })

    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefresh()
    }
    const handleOnline = () => scheduleRefresh()

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("online", handleOnline)

    return () => {
      disposed = true
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("online", handleOnline)
      supabase.removeChannel(channel)
    }
  }, [enabled, tenantId, debounceMs])
}
