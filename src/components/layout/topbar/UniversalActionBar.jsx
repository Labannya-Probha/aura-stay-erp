import { Command } from "lucide-react"
import QuickCreate from "./QuickCreate"
import NotificationCenter from "./NotificationCenter"
import OnlineStatusBadge from "./OnlineStatusBadge"

export default function UniversalActionBar({ role, onOpenCommand }) {
  return (
    <div className="ml-4 flex shrink-0 items-center gap-2">
      <QuickCreate role={role} />
      <NotificationCenter />
      <OnlineStatusBadge />
      <button
        type="button"
        onClick={onOpenCommand}
        className="hidden h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 xl:flex"
      >
        <Command size={15} />
        Ctrl K
      </button>
    </div>
  )
}
