import { useMemo, useState } from "react"

import BookingEngineHeader from "./components/BookingEngineHeader"
import BookingEngineToolbar from "./components/BookingEngineToolbar"
import BookingEngineKpiStrip from "./components/BookingEngineKpiStrip"
import BookingTimelineGrid from "./components/BookingTimelineGrid"
import BookingLegend from "./components/BookingLegend"
import BookingDetailsDrawer from "./components/BookingDetailsDrawer"
import { useBookingEngine } from "./hooks/useBookingEngine"
import {
  buildMonthDateRange,
  startOfMonth,
} from "./utils/dateRange"
import "./booking-engine.css"
import "./booking-engine-month.css"

export default function BookingCalendarEngine({
  company,
  canCreate = false,
  canEdit = false,
  canCancel = false,
  onNewReservation,
  onOpenReservation,
}) {
  const [monthCursor, setMonthCursor] = useState(
    startOfMonth()
  )

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
    () => buildMonthDateRange(monthCursor),
    [monthCursor]
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

  const roomTypes = useMemo(
    () =>
      [
        ...new Set(
          rooms
            .map(
              (room) =>
                room.type || room.name
            )
            .filter(Boolean)
        ),
      ].sort(),
    [rooms]
  )

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
        monthCursor={monthCursor}
        setMonthCursor={setMonthCursor}
        roomTypes={roomTypes}
      />

      {error && (
        <div className="aeds-booking-error">
          {error}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="aeds-booking-conflict">
          <strong>
            {conflicts.length} overlapping
            room assignment
            {conflicts.length > 1 ? "s" : ""}
          </strong>

          <span>
            Resolve conflicts before confirming
            availability to external channels.
          </span>
        </div>
      )}

      {moving && (
        <div className="aeds-booking-moving">
          Moving reservation and validating
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

      <BookingLegend
        reservations={reservations}
      />

      <BookingTimelineGrid
        loading={loading}
        days={days}
        rooms={rooms}
        reservations={reservations}
        canEdit={canEdit}
        onSelectReservation={
          setSelectedReservation
        }
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
        onEdit={(reservationId) =>
          onOpenReservation?.(reservationId)
        }
      />
    </section>
  )
}
