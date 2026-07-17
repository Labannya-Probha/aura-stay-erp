import { RefreshCw } from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"

import { useReservationsList } from "../hooks/useReservationsList"
import { reservationListColumns } from "../reservation-list/reservationListColumns"

export default function ReservationsListTab({
  openReservation,
}) {
  const {
    rows,
    loading,
    refreshing,
    error,
    refresh,
  } = useReservationsList()

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={refresh}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <AedsDataGrid
        title="Reservations Register"
        subtitle="Guest, stay, room assignment, source and folio position"
        data={rows}
        columns={reservationListColumns}
        pageSize={100}
        loading={loading}
        error={error}
        emptyText="No reservation records found."
        getRowId={(row) => row.id}
        onRowClick={(row) =>
          openReservation?.(row.id)
        }
      />
    </div>
  )
}
