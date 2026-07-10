import { CalendarDays, Plus, RefreshCw } from "lucide-react"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default function DashboardHeader({
  company,
  userName,
  loading = false,
  refreshing = false,
  onRefresh,
}) {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  return (
    <div className="aeds-card relative overflow-hidden p-4 lg:p-5">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] bg-[radial-gradient(circle_at_80%_35%,rgba(46,125,50,0.14),transparent_62%)] lg:block" />

      <div className="relative flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black" style={{ color: "var(--tenant-primary, #2E7D32)" }}>
            {getGreeting()}, {userName || "User"}
          </p>

          <h1 className="mt-1 max-w-[760px] text-3xl font-black tracking-tight lg:text-4xl" style={{ color: "var(--tenant-text, #0F172A)" }}>
            {company?.name || "Aura Stay"} Dashboard
          </h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold" style={{ borderColor: "var(--tenant-border, rgb(var(--tenant-primary-rgb, 31 111 120) / 0.18))", background: "var(--tenant-surface, #fff)", color: "var(--tenant-text, #0F172A)" }}>
            <CalendarDays size={16} />
            {today}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || refreshing}
            className="aeds-btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="aeds-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus size={16} />
            New Reservation
          </button>
        </div>
      </div>
    </div>
  )
}
