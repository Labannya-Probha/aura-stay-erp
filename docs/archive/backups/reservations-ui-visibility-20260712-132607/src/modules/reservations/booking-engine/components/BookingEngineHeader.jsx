import { Plus, RefreshCw } from "lucide-react"

export default function BookingEngineHeader({
  company,
  loading,
  refreshing,
  onRefresh,
  onNewReservation,
}) {
  return (
    <div className="aeds-booking-header">
      <div>
        <p className="aeds-booking-eyebrow">Reservations</p>
        <h1 className="aeds-booking-title">Booking Calendar</h1>
        <p className="aeds-booking-subtitle">
          {company?.name || "Property"} · Visual reservation workspace
        </p>
      </div>

      <div className="aeds-booking-actions">
        <button
          type="button"
          onClick={onRefresh}
          className="aeds-btn aeds-btn-secondary"
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>

        {onNewReservation && (
          <button
            type="button"
            onClick={onNewReservation}
            className="aeds-btn aeds-btn-primary"
          >
            <Plus size={16} />
            New Reservation
          </button>
        )}
      </div>
    </div>
  )
}
