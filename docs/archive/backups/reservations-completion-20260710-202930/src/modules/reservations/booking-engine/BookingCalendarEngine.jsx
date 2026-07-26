import { useMemo, useState } from "react"
import BookingEngineHeader from "./components/BookingEngineHeader"
import BookingEngineToolbar from "./components/BookingEngineToolbar"
import BookingEngineKpiStrip from "./components/BookingEngineKpiStrip"
import BookingRoomCardBoard from "./components/BookingRoomCardBoard"
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
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [filters, setFilters] = useState({
    search: "",
    roomType: "ALL",
    status: "ALL",
    floor: "ALL",
  })

  const days = useMemo(() => buildDateRange(viewMode), [viewMode])

  const {
    loading,
    refreshing,
    error,
    rooms,
    reservations,
    kpis,
    refresh,
  } = useBookingEngine({ days, filters })

  return (
    <section className="aeds-booking-engine">
      <BookingEngineHeader
        company={company}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        onNewReservation={canCreate ? onNewReservation : undefined}
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

      <BookingEngineKpiStrip data={kpis} loading={loading} />

      <BookingRoomCardBoard
        loading={loading}
        rooms={rooms}
        reservations={reservations}
        onSelectReservation={(reservation) => {
          setSelectedReservation(reservation)
          if (onOpenReservation) onOpenReservation(reservation.id)
        }}
      />

      <BookingDetailsDrawer
        open={Boolean(selectedReservation)}
        reservation={selectedReservation}
        canEdit={canEdit}
        canCancel={canCancel}
        onClose={() => setSelectedReservation(null)}
      />
    </section>
  )
}
