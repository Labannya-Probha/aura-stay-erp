import { CalendarCheck, CalendarX, CreditCard, Users } from "lucide-react"
import { useReservationKpis } from "../hooks/useReservationKpis"

function Kpi({ label, value, icon: Icon, loading }) {
  return (
    <div className="aeds-kpi-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--tenant-text-muted)" }}>
            {label}
          </p>
          <div className="mt-2 text-2xl font-black" style={{ color: "var(--tenant-text)" }}>
            {loading ? "..." : value}
          </div>
        </div>

        <div className="aeds-icon-tile flex h-11 w-11 items-center justify-center rounded-2xl">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function ReservationKpiStrip() {
  const { data, loading } = useReservationKpis()

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi label="Today's Arrivals" value={data.arrivals} icon={CalendarCheck} loading={loading} />
      <Kpi label="Today's Departures" value={data.departures} icon={CalendarX} loading={loading} />
      <Kpi label="In House" value={data.inHouse} icon={Users} loading={loading} />
      <Kpi label="Pending Payments" value={data.pendingPayments} icon={CreditCard} loading={loading} />
    </div>
  )
}
