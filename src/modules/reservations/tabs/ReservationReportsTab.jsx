import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  BarChart3,
  RefreshCw,
} from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../supabase"
import {
  withTenantScope,
} from "../../../lib/companySettings"

export default function ReservationReportsTab({
  canOpenReportsCenter,
  onOpenReportsCenter,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data, error: queryError } =
      await withTenantScope(
        supabase
          .from("reservations")
          .select(`
            id,
            res_no,
            reservation_name,
            status,
            source,
            check_in,
            check_out,
            created_at,
            pax_adults,
            pax_children,
            guests:primary_guest_id(
              full_name
            ),
            reservation_rooms(
              id,
              rate,
              from_date,
              to_date
            )
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(3000)
      )

    if (queryError) {
      setRows([])
      setError(queryError.message)
    } else {
      setRows(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const reportRows = useMemo(
    () =>
      rows.map((reservation) => {
        const assignments =
          reservation.reservation_rooms || []

        const roomRevenue =
          assignments.reduce(
            (total, assignment) => {
              const nights = numberOfNights(
                assignment.from_date ||
                  reservation.check_in,
                assignment.to_date ||
                  reservation.check_out
              )

              return (
                total +
                Number(assignment.rate || 0) *
                  nights
              )
            },
            0
          )

        return {
          ...reservation,
          guest_name:
            reservation.reservation_name ||
            reservation.guests?.full_name ||
            "—",
          room_count: assignments.length,
          pax:
            Number(
              reservation.pax_adults || 0
            ) +
            Number(
              reservation.pax_children || 0
            ),
          room_revenue: roomRevenue,
        }
      }),
    [rows]
  )

  const summary = useMemo(() => {
    const statusCounts =
      reportRows.reduce(
        (counts, row) => {
          const status =
            row.status || "UNKNOWN"

          counts[status] =
            Number(counts[status] || 0) + 1

          return counts
        },
        {}
      )

    return {
      total: reportRows.length,
      confirmed:
        statusCounts.CONFIRMED || 0,
      inHouse:
        statusCounts.CHECKED_IN || 0,
      cancelled:
        statusCounts.CANCELLED || 0,
      noShow:
        statusCounts.NO_SHOW || 0,
      revenue: reportRows.reduce(
        (sum, row) =>
          sum +
          Number(row.room_revenue || 0),
        0
      ),
    }
  }, [reportRows])

  return (
    <div className="space-y-4">
      <div className="aeds-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={20} />
            <h2 className="text-lg font-black">
              Reservation Analytics
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Booking status, source, stay,
            room volume and estimated room revenue.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={load}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>

          {canOpenReportsCenter && (
            <Button
              onClick={onOpenReportsCenter}
            >
              Open Reports Center
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi
          label="Total Bookings"
          value={summary.total}
        />
        <Kpi
          label="Confirmed"
          value={summary.confirmed}
        />
        <Kpi
          label="In-house"
          value={summary.inHouse}
        />
        <Kpi
          label="Cancelled"
          value={summary.cancelled}
        />
        <Kpi
          label="No Show"
          value={summary.noShow}
        />
        <Kpi
          label="Est. Room Revenue"
          value={`৳${summary.revenue.toLocaleString(
            "en-BD"
          )}`}
        />
      </div>

      <AedsDataGrid
        title="Reservation Analysis"
        subtitle="Booking, source and room revenue dataset"
        data={reportRows}
        columns={[
          {
            accessorKey: "res_no",
            header: "Reservation No.",
            width: 170,
          },
          {
            accessorKey: "guest_name",
            header: "Guest Name",
            width: 220,
          },
          {
            accessorKey: "check_in",
            header: "Check In",
            type: "date",
            width: 140,
          },
          {
            accessorKey: "check_out",
            header: "Check Out",
            type: "date",
            width: 140,
          },
          {
            accessorKey: "room_count",
            header: "Rooms",
            type: "number",
            aggregation: "sum",
            width: 100,
          },
          {
            accessorKey: "pax",
            header: "Pax",
            type: "number",
            aggregation: "sum",
            width: 90,
          },
          {
            accessorKey: "source",
            header: "Source",
            width: 140,
          },
          {
            accessorKey: "status",
            header: "Status",
            type: "status",
            width: 150,
          },
          {
            accessorKey: "room_revenue",
            header: "Est. Revenue",
            type: "currency",
            aggregation: "sum",
            width: 170,
          },
        ]}
        pageSize={100}
        loading={loading}
        error={error}
        emptyText="No reservation data found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="aeds-card p-4">
      <span className="text-xs font-bold uppercase text-slate-500">
        {label}
      </span>

      <strong className="mt-2 block text-xl font-black text-slate-950">
        {value}
      </strong>
    </div>
  )
}

function numberOfNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0

  const start = new Date(
    `${checkIn}T00:00:00`
  )

  const end = new Date(
    `${checkOut}T00:00:00`
  )

  return Math.max(
    1,
    Math.round(
      (end.getTime() - start.getTime()) /
        86_400_000
    )
  )
}
