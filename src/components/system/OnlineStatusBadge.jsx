import { Wifi, WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/offline/useOnlineStatus"

export default function OnlineStatusBadge() {
  const online = useOnlineStatus()

  return (
    <div
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        online
          ? "bg-emerald-50 text-emerald-700"
          : "bg-orange-50 text-orange-700"
      }`}
    >
      <span className="flex items-center gap-2">
        {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {online ? "Online" : "Offline Mode"}
      </span>
    </div>
  )
}