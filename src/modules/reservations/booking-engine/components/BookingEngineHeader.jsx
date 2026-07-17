import {
  CalendarDays,
  Plus,
  RefreshCw,
} from "lucide-react"

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"

export default function BookingEngineHeader({
  company,
  loading,
  refreshing,
  onRefresh,
  onNewReservation,
}) {
  return (
    <div className="aeds-booking-header">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-700">
          <CalendarDays size={22} />
        </div>

        <div>
          <p className="aeds-booking-eyebrow">
            {company?.name || "Aura Stay"}
          </p>

          <h2 className="aeds-booking-title">
            Booking Calendar
          </h2>

          <p className="aeds-booking-subtitle">
            Room assignment, occupancy, rate and reservation timeline.
          </p>
        </div>
      </div>

      <div className="aeds-booking-actions">
        <button
          type="button"
          className={secondaryButton}
          onClick={onRefresh}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>

        {onNewReservation && (
          <button
            type="button"
            className={primaryButton}
            onClick={onNewReservation}
          >
            <Plus size={17} />
            New Reservation
          </button>
        )}
      </div>
    </div>
  )
}
