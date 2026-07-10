import { useEffect, useState } from "react"

export default function OnlineStatusBadge() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const setOnlineState = () => setOnline(true)
    const setOfflineState = () => setOnline(false)

    window.addEventListener("online", setOnlineState)
    window.addEventListener("offline", setOfflineState)

    return () => {
      window.removeEventListener("online", setOnlineState)
      window.removeEventListener("offline", setOfflineState)
    }
  }, [])

  return (
    <div
      className={
        online
          ? "hidden items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 xl:flex"
          : "hidden items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 xl:flex"
      }
    >
      <span className={online ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-amber-500"} />
      {online ? "Online" : "Offline"}
    </div>
  )
}
