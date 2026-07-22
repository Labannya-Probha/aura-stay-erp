import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  getUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "./notification.service"

export function useNotificationCenter({ tenantId, limit = 100 }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const loadIdRef = useRef(0)

  const load = useCallback(async ({ silent = false } = {}) => {
    const loadId = ++loadIdRef.current
    silent ? setRefreshing(true) : setLoading(true)
    setError("")
    try {
      const nextRows = await getUnreadNotifications({ limit, tenantId })
      if (loadId === loadIdRef.current) setRows(nextRows)
    } catch (loadError) {
      if (loadId === loadIdRef.current) {
        setError(loadError?.message || "Notifications could not be loaded.")
      }
    } finally {
      if (loadId === loadIdRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [limit, tenantId])

  useEffect(() => {
    load()
    return subscribeToNotifications({
      tenantId,
      onInsert: (row) => setRows((current) => [row, ...current.filter((item) => item.id !== row.id)].slice(0, limit)),
      onChange: () => load({ silent: true }),
    })
  }, [load, limit, tenantId])

  useEffect(() => {
    const refresh = () => document.visibilityState === "visible" && load({ silent: true })
    document.addEventListener("visibilitychange", refresh)
    window.addEventListener("online", refresh)
    return () => {
      document.removeEventListener("visibilitychange", refresh)
      window.removeEventListener("online", refresh)
    }
  }, [load])

  const unreadCount = useMemo(() => rows.filter((row) => !row.is_read).length, [rows])
  const severityCounts = useMemo(() => rows.reduce((summary, row) => {
    const key = String(row.severity || "INFO").toUpperCase()
    summary[key] = Number(summary[key] || 0) + 1
    return summary
  }, {}), [rows])

  async function readOne(id) {
    const previous = rows
    setRows((current) => current.filter((row) => row.id !== id))
    try {
      await markNotificationRead(id)
    } catch (readError) {
      setRows(previous)
      setError(readError?.message || "Notification could not be updated.")
    }
  }

  async function readAll() {
    const previous = rows
    setRows([])
    try {
      await markAllNotificationsRead()
    } catch (readError) {
      setRows(previous)
      setError(readError?.message || "Notifications could not be updated.")
    }
  }

  return { rows, loading, refreshing, error, unreadCount, severityCounts, refresh: () => load({ silent: true }), readOne, readAll }
}
