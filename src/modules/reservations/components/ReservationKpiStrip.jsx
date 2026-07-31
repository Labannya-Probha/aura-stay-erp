import { CalendarCheck, CalendarX, CreditCard, Users } from 'lucide-react'
import { useReservationKpis } from '../hooks/useReservationKpis'

function Kpi({ label, value, icon: Icon, loading }) {
  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: 'var(--tenant-text-muted)' }}
          >
            {label}
          </p>
          <div
            className="mt-2 text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--tenant-text)' }}
          >
            {loading ? '...' : value}
          </div>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 text-slate-700">
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
      <Kpi
        label="Pending Payments"
        value={data.pendingPayments}
        icon={CreditCard}
        loading={loading}
      />
    </div>
  )
}
