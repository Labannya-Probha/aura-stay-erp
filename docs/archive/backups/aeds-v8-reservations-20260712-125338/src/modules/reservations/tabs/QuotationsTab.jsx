import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../lib/supabase"
import {
  withTenantScope,
} from "../../../lib/companySettings"

export default function QuotationsTab({
  onCreateReservation,
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
          .from("quotations")
          .select(`
            id,
            quote_no,
            reservation_id,
            total_amount,
            room_rate,
            room_count,
            discount_pct,
            valid_until,
            status,
            message,
            created_at,
            reservations(
              res_no,
              reservation_name,
              check_in,
              check_out,
              source,
              guests:primary_guest_id(
                full_name,
                phone,
                email
              )
            )
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(500)
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

  const gridRows = useMemo(
    () =>
      rows.map((quote) => {
        const reservation =
          quote.reservations || {}

        const guest =
          reservation.guests || {}

        return {
          ...quote,
          reservation_no:
            reservation.res_no || "—",
          guest_name:
            reservation.reservation_name ||
            guest.full_name ||
            "—",
          guest_phone: guest.phone || "—",
          check_in: reservation.check_in,
          check_out: reservation.check_out,
          source: reservation.source || "Direct",
        }
      }),
    [rows]
  )

  return (
    <div className="space-y-4">
      <div className="aeds-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <h2 className="text-lg font-black">
              Quotation Register
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Draft, sent, accepted and expired
            reservation quotations.
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

          <Button
            onClick={() =>
              onCreateReservation?.()
            }
          >
            <Plus size={16} />
            New Quotation
          </Button>
        </div>
      </div>

      <AedsDataGrid
        title="Quotations"
        subtitle="Reservation quotation lifecycle"
        data={gridRows}
        columns={[
          {
            accessorKey: "quote_no",
            header: "Quotation No.",
            width: 160,
          },
          {
            accessorKey: "reservation_no",
            header: "Reservation No.",
            width: 170,
          },
          {
            accessorKey: "guest_name",
            header: "Guest Name",
            width: 220,
          },
          {
            accessorKey: "guest_phone",
            header: "Mobile",
            width: 150,
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
            width: 100,
          },
          {
            accessorKey: "room_rate",
            header: "Rate",
            type: "currency",
            width: 140,
          },
          {
            accessorKey: "discount_pct",
            header: "Discount",
            type: "percent",
            width: 120,
          },
          {
            accessorKey: "total_amount",
            header: "Total",
            type: "currency",
            aggregation: "sum",
            width: 150,
          },
          {
            accessorKey: "valid_until",
            header: "Valid Until",
            type: "date",
            width: 140,
          },
          {
            accessorKey: "status",
            header: "Status",
            type: "status",
            width: 140,
          },
          {
            accessorKey: "source",
            header: "Source",
            width: 130,
          },
        ]}
        pageSize={100}
        loading={loading}
        error={error}
        emptyText="No quotations found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}
