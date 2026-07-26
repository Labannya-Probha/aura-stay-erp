import DashboardHeader from "./DashboardHeader"
import KPIGrid from "./widgets/KPIGrid"
import RevenueChart from "./widgets/RevenueChart"
import OccupancyChart from "./widgets/OccupancyChart"
import ArrivalsDeparturesWidget from "./widgets/ArrivalsDeparturesWidget"
import NotificationsWidget from "./widgets/NotificationsWidget"
import { CalendarCheck, BedDouble, ClipboardList, Moon, BarChart3 } from "lucide-react"

export default function Dashboard({
  company,
  userName,
  loading,
  refreshing,
  error,
  summary,
  revenueTrend,
  occupancyTrend,
  housekeeping,
  restaurant,
  tasks,
  activities,
  refresh,
}) {
  return (
    <section className="aeds-dashboard">
      <DashboardHeader
        company={company}
        userName={userName}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <KPIGrid loading={loading} data={summary} />

      <div className="grid min-w-0 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <RevenueChart loading={loading} data={revenueTrend} summary={summary} />
        </div>
        <div className="xl:col-span-3">
          <OccupancyChart loading={loading} data={occupancyTrend} summary={summary} housekeeping={housekeeping} />
        </div>
        <div className="space-y-4 xl:col-span-3">
          <ArrivalsDeparturesWidget loading={loading} summary={summary} />
          <NotificationsWidget loading={loading} data={activities} />
        </div>
      </div>

      <div className="aeds-card flex flex-wrap items-center gap-2.5 px-3 py-2.5">
        <div className="pr-2 text-sm font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>Quick Links</div>
        {[
          { label: "New Reservation", icon: CalendarCheck },
          { label: "Room Board", icon: BedDouble },
          { label: "In-House Guests", icon: ClipboardList },
          { label: "Night Audit", icon: Moon },
          { label: "Reports Center", icon: BarChart3 },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition"
            style={{
              borderColor: "var(--tenant-border, rgb(var(--tenant-primary-rgb, 31 111 120) / 0.16))",
              background: "var(--tenant-surface, #fff)",
              color: "var(--tenant-text-muted, #64748B)",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
