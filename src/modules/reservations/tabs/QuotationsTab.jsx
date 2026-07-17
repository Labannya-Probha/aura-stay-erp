import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { RefreshCw } from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../supabase"
import {
  withTenantScope,
} from "../../../lib/companySettings"

export default function QuotationsTab() {
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
            reservation_id,
            quote_no,
            total_amount,
            valid_until,
            room_rate,
            room_count,
            discount_pct,
            status,
            message,
            created_at,
            updated_at,
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
          .order("updated_at", {
            ascending: false,
            nullsFirst: false,
          })
          .limit(1000)
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
          mobile: guest.phone || "—",
          check_in: reservation.check_in,
          check_out: reservation.check_out,
          source:
            reservation.source || "Direct",
          last_updated:
            quote.updated_at ||
            quote.created_at,
        }
      }),
    [rows]
  )

  return (
    <div className="space-y-4">
      <div className="aeds-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Quotation Register
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            One quotation per reservation. Reservation
            creation automatically creates the quotation;
            later updates keep the same quotation number.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </Button>
      </div>

      <AedsDataGrid
        title="Quotations"
        subtitle="Auto-created reservation quotation register"
        data={gridRows}
        columns={[
          {
            accessorKey: "quote_no",
            header: "Quotation No.",
            width: 200,
          },
          {
            accessorKey: "reservation_no",
            header: "Reservation No.",
            width: 190,
          },
          {
            accessorKey: "guest_name",
            header: "Guest Name",
            width: 220,
          },
          {
            accessorKey: "mobile",
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
            header: "Base Rate",
            type: "currency",
            width: 150,
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
            width: 160,
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
            width: 140,
          },
          {
            accessorKey: "last_updated",
            header: "Last Updated",
            type: "date",
            width: 160,
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
