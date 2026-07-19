import { useMemo, useState } from "react"
import ReservationTable from "./components/ReservationTable"
import ReservationListToolbar from "./components/ReservationListToolbar"
import { useReservations } from "../hooks/useReservations"

export default function ReservationListPage({ openReservation }) {
  const [filters, setFilters] = useState({ search: "", status: "ALL" })
  const stableFilters = useMemo(() => filters, [filters])
  const { rows, loading, error, refresh } = useReservations(stableFilters)

  return (
    <section className="space-y-4">
      <ReservationListToolbar
        filters={filters}
        setFilters={setFilters}
        onRefresh={refresh}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <ReservationTable
        rows={rows}
        loading={loading}
        onOpen={openReservation}
      />
    </section>
  )
}
