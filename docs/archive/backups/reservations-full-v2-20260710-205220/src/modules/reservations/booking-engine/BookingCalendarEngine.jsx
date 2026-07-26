import { useMemo, useState } from "react"

import BookingEngineHeader from "./components/BookingEngineHeader"
import BookingEngineToolbar from "./components/BookingEngineToolbar"
import BookingEngineKpiStrip from "./components/BookingEngineKpiStrip"
import BookingTimelineGrid from "./components/BookingTimelineGrid"
import BookingLegend from "./components/BookingLegend"
import BookingDetailsDrawer from "./components/BookingDetailsDrawer"
import { useBookingEngine } from "./hooks/useBookingEngine"
import { buildDateRange } from "./utils/dateRange"
import "./booking-engine.css"

export default function BookingCalendarEngine({
  company,
  canCreate = false,
  canEdit = false,
  canCancel = false,
  onNewReservation,
  onOpenReservation,
}) {
  const [viewMode, setViewMode] = useState("14D")
  const [
    selectedReservation,
    setSelectedReservation,
  ] = useState(null)

  const [filters, setFilters] = useState({
    search: "",
    roomType: "ALL",
    status: "ALL",
  })

  const days = useMemo(
    () => buildDateRange(viewMode),
    [viewMode]
  )

  const {
    loading,
    refreshing,
    moving,
    error,
    rooms,
    reservations,
    conflicts,
    kpis,
    refresh,
    moveBooking,
  } = useBookingEngine({
    days,
    filters,
  })

  return (
    <section className="aeds-booking-engine">
      <BookingEngineHeader
        company={company}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        onNewReservation={
          canCreate
            ? onNewReservation
            : undefined
        }
      />

      <BookingEngineToolbar
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {error && (
        <div className="aeds-booking-error">
          {error}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="aeds-booking-conflict">
          <strong>
            {conflicts.length} booking conflict
            {conflicts.length > 1 ? "s" : ""} detected.
          </strong>

          <span>
            Review overlapping reservations before
            confirming or moving rooms.
          </span>
        </div>
      )}

      {moving && (
        <div className="aeds-booking-moving">
          Moving reservation and validating room
          availability...
        </div>
      )}

      <BookingEngineKpiStrip
        data={{
          ...kpis,
          conflicts: conflicts.length,
        }}
        loading={loading}
      />

      <BookingLegend />

      <BookingTimelineGrid
        loading={loading}
        days={days}
        rooms={rooms}
        reservations={reservations}
        canEdit={canEdit}
        onSelectReservation={(reservation) => {
          setSelectedReservation(reservation)
        }}
        onMoveReservation={moveBooking}
      />

      <BookingDetailsDrawer
        open={Boolean(selectedReservation)}
        reservation={selectedReservation}
        canEdit={canEdit}
        canCancel={canCancel}
        onClose={() =>
          setSelectedReservation(null)
        }
        onEdit={(reservationId) => {
          onOpenReservation?.(reservationId)
        }}
      />
    </section>
  )
}
