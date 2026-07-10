import { useEffect, useState } from "react"
import { syncPendingQueue } from "./offlineQueue"

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    async function handleOnline() {
      setOnline(true)
      await syncPendingQueue()
    }

    function handleOffline() {
      setOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return online
}