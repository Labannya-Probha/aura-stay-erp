import { Bell } from "lucide-react"

export default function NotificationsWidget({ loading = false, data = [] }) {
  const rows = Array.isArray(data) ? data.slice(0, 4) : []

  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        borderColor: "var(--tenant-border, rgb(var(--tenant-primary-rgb, 31 111 120) / 0.18))",
        background: "var(--tenant-surface, #fff)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>
          <Bell size={15} style={{ color: "var(--tenant-primary, #1F6F78)" }} />
          Recent Notifications
        </h2>
        <button type="button" className="text-xs font-black" style={{ color: "var(--tenant-primary, #1F6F78)" }}>View All</button>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => <div key={i} className="h-9 animate-pulse rounded-xl" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.08)" }} />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl px-4 py-5 text-center text-xs font-bold" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.06)", color: "var(--tenant-text-muted, #64748B)" }}>
          No recent notifications
        </div>
      ) : (
        <div className="space-y-1.5">
          {rows.map((item, index) => (
            <div key={`${item.time}-${index}`} className="rounded-xl border px-3 py-2" style={{ borderColor: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.12)" }}>
              <div className="truncate text-xs font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>{item.title || "Notification"}</div>
              <div className="mt-0.5 flex items-center justify-between text-[11px] font-semibold" style={{ color: "var(--tenant-text-muted, #64748B)" }}>
                <span className="truncate">{item.meta || "System"}</span>
                <span>{item.time || "--:--"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
