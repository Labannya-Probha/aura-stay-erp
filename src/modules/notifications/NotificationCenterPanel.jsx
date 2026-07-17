import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CircleAlert,
  Info,
  X,
} from "lucide-react"

const severityIcon = {
  CRITICAL: CircleAlert,
  HIGH: AlertTriangle,
  MEDIUM: AlertTriangle,
  INFO: Info,
}

const severityClass = {
  CRITICAL:
    "border-red-200 bg-red-50 text-red-700",
  HIGH:
    "border-orange-200 bg-orange-50 text-orange-700",
  MEDIUM:
    "border-amber-200 bg-amber-50 text-amber-700",
  INFO:
    "border-sky-200 bg-sky-50 text-sky-700",
}

export default function NotificationCenterPanel({
  open,
  rows,
  loading,
  error,
  onClose,
  onRead,
  onReadAll,
  onNavigate,
}) {
  if (!open) return null

  return (
    <div className="absolute right-0 top-full z-[90] mt-3 w-[min(440px,94vw)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={19} />
            <h2 className="font-black text-slate-950">
              Notification Center
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Live operational alerts and pending actions
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <span className="text-xs font-bold text-slate-500">
          Unread notifications
        </span>

        <button
          type="button"
          onClick={onReadAll}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700"
        >
          <CheckCheck size={15} />
          Mark all read
        </button>
      </div>

      <div className="max-h-[520px] overflow-auto p-3">
        {loading && (
          <div className="p-8 text-center text-sm text-slate-400">
            Loading notifications...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          rows.length === 0 && (
            <div className="p-10 text-center text-sm font-semibold text-slate-400">
              No pending notification.
            </div>
          )}

        {!loading &&
          rows.map((row) => {
            const severity = String(
              row.severity || "INFO"
            ).toUpperCase()

            const Icon =
              severityIcon[severity] || Info

            return (
              <button
                type="button"
                key={row.id}
                onClick={async () => {
                  await onRead?.(row.id)
                  onNavigate?.(row)
                }}
                className="mb-2 block w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                      severityClass[severity] ||
                      severityClass.INFO
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-950">
                      {row.title}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {row.description}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <span>{row.module}</span>
                      <span>•</span>
                      <span>{row.category}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
      </div>
    </div>
  )
}
