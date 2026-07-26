import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  getUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "./notification.service"

export function useNotificationCenter({
  tenantId,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      setRows(
        await getUnreadNotifications({
          limit: 100,
        })
      )
    } catch (loadError) {
      setRows([])
      setError(
        loadError?.message ||
          "Notifications could not be loaded."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    return subscribeToNotifications({
      tenantId,
      onChange: load,
    })
  }, [load, tenantId])

  const unreadCount = useMemo(
    () =>
      rows.filter((row) => !row.is_read).length,
    [rows]
  )

  const severityCounts = useMemo(
    () =>
      rows.reduce(
        (summary, row) => {
          const key = String(
            row.severity || "INFO"
          ).toUpperCase()

          summary[key] =
            Number(summary[key] || 0) + 1

          return summary
        },
        {}
      ),
    [rows]
  )

  async function readOne(id) {
    await markNotificationRead(id)
    await load()
  }

  async function readAll() {
    await markAllNotificationsRead()
    await load()
  }

  return {
    rows,
    loading,
    error,
    unreadCount,
    severityCounts,
    refresh: load,
    readOne,
    readAll,
  }
}
