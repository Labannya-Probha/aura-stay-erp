import { RefreshCw, Radio } from "lucide-react"

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
    isLive,
    realtimeStatus,
    lastUpdatedAt,
  } = useReservationsList()

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
            title={`Realtime status: ${realtimeStatus}`}
          >
            <Radio size={13} className={isLive ? "animate-pulse" : ""} />
            {isLive ? "Live" : "Connecting"}
          </span>

          {lastUpdatedAt && (
            <span>
              Updated {lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

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
