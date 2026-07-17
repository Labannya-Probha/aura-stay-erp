import { useState } from "react"
import { Bell } from "lucide-react"

const NOTIFICATIONS = [
  { id: 1, title: "Today arrivals pending", meta: "Front Office" },
  { id: 2, title: "Dirty rooms require attention", meta: "Housekeeping" },
  { id: 3, title: "Night audit checklist pending", meta: "Audit" },
]

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
      >
        <Bell size={17} />
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
          {NOTIFICATIONS.length}
        </span>
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="text-sm font-black text-slate-900">Notification Center</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Operational alerts and pending actions</div>
            </div>
            <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {NOTIFICATIONS.map((item) => (
                <button key={item.id} type="button" className="block w-full px-4 py-3 text-left transition hover:bg-slate-50">
                  <div className="text-sm font-bold text-slate-800">{item.title}</div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-400">{item.meta}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
