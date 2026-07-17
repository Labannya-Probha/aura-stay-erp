import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  CalendarClock,
  RefreshCw,
} from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../supabase"

const EVENT_LABELS = {
  RESERVATION_CREATED: "Reservation Created",
  STATUS_CHANGED: "Status Changed",
  ROOM_ASSIGNED: "Room Assigned",
  ROOM_CHANGED: "Room Changed",
  ROOM_REMOVED: "Room Removed",
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
  PAYMENT_RECEIVED: "Payment Received",
  REFUND_PROCESSED: "Refund",
  DISCOUNT_APPLIED: "Discount",
}

function eventLabel(value) {
  return (
    EVENT_LABELS[value] ||
    String(value || "Activity")
      .replaceAll("_", " ")
  )
}

function eventTone(eventType) {
  if (
    [
      "REFUND_PROCESSED",
      "ROOM_REMOVED",
    ].includes(eventType)
  ) {
    return "danger"
  }

  if (
    [
      "STATUS_CHANGED",
      "ROOM_CHANGED",
      "DISCOUNT_APPLIED",
    ].includes(eventType)
  ) {
    return "warning"
  }

  return "success"
}

function detailText(row) {
  const details = row.details || {}

  switch (row.event_type) {
    case "STATUS_CHANGED":
      return `${details.old_status || "—"} → ${
        details.new_status || "—"
      }`

    case "ROOM_CHANGED":
      return `${
        details.old_room_no || "Unassigned"
      } → ${details.new_room_no || "Unassigned"}`

    case "ROOM_ASSIGNED":
      return `Room ${
        details.room_no || "—"
      } · ${details.from_date || "—"} to ${
        details.to_date || "—"
      }`

    case "ROOM_REMOVED":
      return `Room ${
        details.room_no || "—"
      } removed`

    case "PAYMENT_RECEIVED":
      return `${details.method || "Payment"} · ৳${Number(
        details.amount || 0
      ).toLocaleString("en-BD")}`

    case "REFUND_PROCESSED":
      return `${details.method || "Refund"} · ৳${Number(
        details.amount || 0
      ).toLocaleString("en-BD")}`

    case "DISCOUNT_APPLIED":
      return details.discount_type === "fixed"
        ? `Fixed discount ৳${Number(
            details.discount_value || 0
          ).toLocaleString("en-BD")}`
        : `Discount ${Number(
            details.discount_percent || 0
          )}%`

    case "CHECK_IN":
      return `Checked in at ${
        details.check_in_at || row.event_at || "—"
      }`

    case "CHECK_OUT":
      return `Checked out at ${
        details.check_out_at || row.event_at || "—"
      }`

    default:
      return (
        details.description ||
        details.message ||
        JSON.stringify(details)
      )
  }
}

export default function ReservationHistoryTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data, error: queryError } =
      await supabase.rpc(
        "reservation_history_timeline",
        {
          p_reservation_id: null,
          p_limit: 2000,
        }
      )

    if (queryError) {
      setRows([])
      setError(queryError.message)
    } else {
      setRows(
        Array.isArray(data)
          ? data
          : []
      )
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const historyRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        event_label: eventLabel(
          row.event_type
        ),
        event_status: eventTone(
          row.event_type
        ),
        details_text: detailText(row),
        user_display:
          row.actor_name ||
          row.actor_email ||
          "System",
        device_ip:
          [
            row.device,
            row.ip_address,
          ]
            .filter(Boolean)
            .join(" · ") || "—",
      })),
    [rows]
  )

  return (
    <div className="space-y-4">
      <div className="aeds-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CalendarClock size={21} />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950">
              Reservation Activity Timeline
            </h2>

            <p className="text-sm text-slate-500">
              Booking, room, payment, refund,
              discount and guest-stay events.
            </p>
          </div>
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
        title="Reservation History"
        subtitle="Enterprise PMS activity and audit timeline"
        data={historyRows}
        columns={[
          {
            accessorKey: "event_at",
            header: "Timestamp",
            type: "date",
            width: 180,
          },
          {
            accessorKey: "reservation_no",
            header: "Reservation No.",
            width: 180,
          },
          {
            accessorKey: "guest_name",
            header: "Guest Name",
            width: 220,
          },
          {
            accessorKey: "event_label",
            header: "Event",
            type: "status",
            width: 190,
          },
          {
            accessorKey: "details_text",
            header: "Details",
            width: 420,
          },
          {
            accessorKey: "user_display",
            header: "User",
            width: 190,
          },
          {
            accessorKey: "device_ip",
            header: "Device / IP",
            width: 220,
          },
          {
            accessorKey: "source",
            header: "Source",
            width: 140,
          },
        ]}
        pageSize={100}
        loading={loading}
        error={error}
        emptyText="No reservation activity recorded."
        getRowId={(row, index) =>
          row.id || `${row.event_at}-${index}`
        }
      />
    </div>
  )
}
