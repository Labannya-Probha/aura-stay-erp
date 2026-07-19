import {
  BarChart3,
  BedDouble,
  CalendarCheck,
  ClipboardList,
  Moon,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { PATHS } from "../../app/paths"
import DashboardHeader from "./DashboardHeader"
import KPIGrid from "./widgets/KPIGrid"
import RevenueChart from "./widgets/RevenueChart"
import OccupancyChart from "./widgets/OccupancyChart"
import ArrivalsDeparturesWidget from "./widgets/ArrivalsDeparturesWidget"
import NotificationsWidget from "./widgets/NotificationsWidget"
import "../../styles/aeds-v6-migration.css"

function numericValue(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function OperationalPulse({ summary, housekeeping, restaurant, tasks }) {
  const cards = [
    {
      label: "Rooms to inspect",
      value: numericValue(
        housekeeping?.inspectionPending ??
          housekeeping?.pending ??
          summary?.dirtyRooms
      ),
      detail: "Housekeeping queue",
    },
    {
      label: "Restaurant open orders",
      value: numericValue(
        restaurant?.openOrders ??
          restaurant?.pendingOrders ??
          summary?.restaurantOrders
      ),
      detail: "Live POS operation",
    },
    {
      label: "Pending approvals",
      value: Array.isArray(tasks)
        ? tasks.length
        : numericValue(tasks?.pending ?? summary?.pendingTasks),
      detail: "Needs management action",
    },
  ]

  return (
    <div className="aeds-v6-pulse-grid">
      {cards.map((card) => (
        <article key={card.label} className="aeds-v6-pulse-card">
          <div>
            <span>{card.label}</span>
            <strong>{card.value.toLocaleString("en-BD")}</strong>
          </div>
          <small>{card.detail}</small>
        </article>
      ))}
    </div>
  )
}

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
  lastUpdated,
  isLive,
  notifications,
  notificationsLoading,
  notificationsError,
}) {
  const navigate = useNavigate()

  const quickLinks = [
    {
      label: "New Reservation",
      icon: CalendarCheck,
      path: `${PATHS.RESERVATIONS}?tab=new`,
    },
    {
      label: "Room Board",
      icon: BedDouble,
      path: `${PATHS.FRONT_OFFICE}?tab=room-board`,
    },
    {
      label: "In-House Guests",
      icon: ClipboardList,
      path: `${PATHS.FRONT_OFFICE}?tab=in-house`,
    },
    {
      label: "Night Audit",
      icon: Moon,
      path: `${PATHS.FRONT_OFFICE}?tab=night-audit`,
    },
    {
      label: "Reports Center",
      icon: BarChart3,
      path: PATHS.REPORTS,
    },
  ]

  return (
    <section className="aeds-dashboard aeds-v6-dashboard">
      <div className="aeds-v6-dashboard-hero">
        <div className="aeds-v6-dashboard-hero-copy">
          <div className="aeds-v6-eyebrow">
            <Sparkles size={14} />
            AEDS v6 Management Workspace
          </div>

          <DashboardHeader
            company={company}
            userName={userName}
            loading={loading}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        </div>

        <button
          type="button"
          className="aeds-v6-refresh-button"
          onClick={refresh}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh data
        </button>
        <div className="text-xs font-bold text-slate-500" aria-live="polite">
          {isLive ? "Live" : "Manual"} · {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}` : "Waiting for data"}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <KPIGrid loading={loading} data={summary} />

      <OperationalPulse
        summary={summary}
        housekeeping={housekeeping}
        restaurant={restaurant}
        tasks={tasks}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <RevenueChart
            loading={loading}
            data={revenueTrend}
            summary={summary}
          />
        </div>

        <div className="xl:col-span-5">
          <OccupancyChart
            loading={loading}
            data={occupancyTrend}
            summary={summary}
            housekeeping={housekeeping}
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ArrivalsDeparturesWidget
            loading={loading}
            summary={summary}
          />
        </div>

        <div className="xl:col-span-5">
          <NotificationsWidget
            loading={notificationsLoading || loading}
            error={notificationsError}
            data={notifications?.length ? notifications : activities}
          />
        </div>
      </div>

      <div className="aeds-v6-quick-links">
        <div className="aeds-v6-quick-links-title">
          <span>Quick actions</span>
          <small>Frequently used operations</small>
        </div>

        <div className="aeds-v6-quick-links-list">
          {quickLinks.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(path)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
