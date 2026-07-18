import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { RefreshCw } from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../lib/supabase"
import {
  withTenantScope,
} from "../../../lib/companySettings"

export default function ReservationHistoryTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data, error: queryError } =
      await withTenantScope(
        supabase
          .from("audit_log")
          .select(
            "id,at,actor,action,entity,entity_id,details"
          )
          .eq("entity", "reservation")
          .order("at", {
            ascending: false,
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

  const historyRows = useMemo(
    () =>
      rows.map((entry) => ({
        ...entry,
        event_at: entry.at,
        reference:
          entry.entity_id || "—",
        performed_by:
          entry.actor || "System",
        details_text:
          typeof entry.details === "string"
            ? entry.details
            : JSON.stringify(
                entry.details || {}
              ),
      })),
    [rows]
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
        title="Reservation History"
        subtitle="Status changes, payments, room moves and user actions"
        data={historyRows}
        columns={[
          {
            accessorKey: "event_at",
            header: "Date & Time",
            type: "date",
            width: 170,
          },
          {
            accessorKey: "reference",
            header: "Reservation",
            width: 180,
          },
          {
            accessorKey: "action",
            header: "Action",
            type: "status",
            width: 170,
          },
          {
            accessorKey: "performed_by",
            header: "Performed By",
            width: 180,
          },
          {
            accessorKey: "details_text",
            header: "Details",
            width: 480,
          },
        ]}
        pageSize={100}
        loading={loading}
        error={error}
        emptyText="No reservation history recorded."
        getRowId={(row) => row.id}
      />
    </div>
  )
}
