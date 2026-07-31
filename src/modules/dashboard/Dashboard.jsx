import { BarChart3, BedDouble, CalendarCheck, ClipboardList, Moon, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { PATHS } from '../../app/paths'
import RevenueChart from './widgets/RevenueChart'
import OccupancyChart from './widgets/OccupancyChart'
import ArrivalsDeparturesWidget from './widgets/ArrivalsDeparturesWidget'
import NotificationsWidget from './widgets/NotificationsWidget'
import ExecutiveCommandCenter from '../../components/executive/ExecutiveCommandCenter'
import '../../styles/aeds-v6-migration.css'

function numericValue(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function OperationalPulse({ summary, housekeeping, restaurant, tasks }) {
  const cards = [
    {
      label: 'Rooms to inspect',
      value: numericValue(
        housekeeping?.inspectionPending ?? housekeeping?.pending ?? summary?.dirtyRooms,
      ),
      detail: 'Housekeeping queue',
    },
    {
      label: 'Restaurant open orders',
      value: numericValue(
        restaurant?.openOrders ?? restaurant?.pendingOrders ?? summary?.restaurantOrders,
      ),
      detail: 'Live POS operation',
    },
    {
      label: 'Pending approvals',
      value: Array.isArray(tasks)
        ? tasks.length
        : numericValue(tasks?.pending ?? summary?.pendingTasks),
      detail: 'Needs management action',
    },
  ]

  return (
    <div className="aeds-v6-pulse-grid">
      {cards.map((card) => (
        <article key={card.label} className="aeds-v6-pulse-card">
          <div>
            <span>{card.label}</span>
            <strong>{card.value.toLocaleString('en-BD')}</strong>
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
  rooms,
  roomsLoading,
  roomsError,
  roomsRefreshing,
  onRoomsRefresh,
}) {
  const navigate = useNavigate()
  const commandCenterError = error || roomsError

  const quickLinks = [
    {
      label: 'New Reservation',
      icon: CalendarCheck,
      path: `${PATHS.RESERVATIONS}?tab=new`,
    },
    {
      label: 'Room Board',
      icon: BedDouble,
      path: `${PATHS.FRONT_OFFICE}?tab=room-board`,
    },
    {
      label: 'In-House Guests',
      icon: ClipboardList,
      path: `${PATHS.FRONT_OFFICE}?tab=in-house`,
    },
    {
      label: 'Night Audit',
      icon: Moon,
      path: `${PATHS.FRONT_OFFICE}?tab=night-audit`,
    },
    {
      label: 'Reports Center',
      icon: BarChart3,
      path: PATHS.REPORTS,
    },
  ]

  return (
    <ExecutiveCommandCenter
      title="Operations command center"
      subtitle="Live hotel performance, room flow, and staff priorities in a calm enterprise workspace."
      eyebrow="Hospitality Operations"
      companyName={company?.name}
      loading={loading}
      error={commandCenterError}
      isLive={isLive}
      lastUpdated={lastUpdated}
      refreshing={refreshing}
      summary={summary}
      revenueTrend={revenueTrend}
      occupancyTrend={occupancyTrend}
      rooms={rooms}
      roomsLoading={roomsLoading || roomsRefreshing}
      onRefresh={refresh}
    >
      <section className="aeds-dashboard aeds-v6-dashboard">
        <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--tenant-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--tenant-surface)_78%,white)]/80 p-3 shadow-[0_14px_32px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-text-muted)]">
                Operational pulse
              </p>
              <p className="text-sm font-semibold text-[color:var(--tenant-text)]">
                The property is running at a glance.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--tenant-primary)_22%,var(--tenant-border))] bg-[color-mix(in_srgb,var(--tenant-primary)_10%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--tenant-primary)]">
              <Sparkles size={14} />
              Live readiness
            </div>
          </div>
          <OperationalPulse
            summary={summary}
            housekeeping={housekeeping}
            restaurant={restaurant}
            tasks={tasks}
          />
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <RevenueChart loading={loading} data={revenueTrend} summary={summary} />
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
              onViewAll={() => navigate(PATHS.RESERVATIONS)}
            />
          </div>

          <div className="xl:col-span-5">
            <NotificationsWidget
              loading={notificationsLoading || loading}
              error={notificationsError}
              data={notifications?.length ? notifications : activities}
              onViewAll={() => navigate(PATHS.TASKS || '/tasks')}
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
              <button key={label} type="button" onClick={() => navigate(path)}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </ExecutiveCommandCenter>
  )
}
