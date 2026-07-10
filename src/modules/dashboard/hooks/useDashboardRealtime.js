import { useEffect } from "react"
import { supabase } from "../../../supabase"

const WATCHED_TABLES = [
  "reservations",
  "rooms",
  "folio_charges",
  "payments",
  "requisitions",
]

export function useDashboardRealtime({ enabled = true, onChange }) {
  useEffect(() => {
    if (!enabled || typeof onChange !== "function") return undefined

    let timer = null

    function refreshSoftly() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        onChange()
      }, 700)
    }

    const channel = supabase.channel("aeds-dashboard-realtime")

    WATCHED_TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        refreshSoftly
      )
    })

    channel.subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [enabled, onChange])
}
