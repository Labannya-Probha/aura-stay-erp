import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { supabase } from "../../../supabase"

function firstValue(row, keys, fallback = "") {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== null && value !== undefined && value !== "") {
      return value
    }
  }

  return fallback
}

function normalizeReservation(row) {
  const guest =
    row.guest ||
    row.guests ||
    row.guest_profile ||
    {}

  const room =
    row.room ||
    row.rooms ||
    {}

  const roomType =
    row.room_type ||
    row.room_types ||
    {}

  return {
    id: row.id,
    reservationNo: firstValue(
      row,
      [
        "reservation_no",
        "booking_no",
        "confirmation_no",
        "reference_no",
      ],
      String(row.id || "").slice(0, 8)
    ),
    guestName: firstValue(
      row,
      ["guest_name", "primary_guest_name"],
      firstValue(
        guest,
        ["full_name", "name", "guest_name"],
        "Guest"
      )
    ),
    mobile: firstValue(
      row,
      ["mobile", "phone", "guest_mobile"],
      firstValue(guest, ["mobile", "phone"])
    ),
    checkIn: firstValue(row, [
      "check_in",
      "check_in_date",
      "arrival_date",
    ]),
    checkOut: firstValue(row, [
      "check_out",
      "check_out_date",
      "departure_date",
    ]),
    roomType: firstValue(
      row,
      ["room_type_name", "room_type"],
      firstValue(roomType, ["name", "room_type_name"])
    ),
    roomNumber: firstValue(
      row,
      ["room_number", "room_no"],
      firstValue(room, ["room_number", "room_no", "number"])
    ),
    source: firstValue(row, [
      "booking_source",
      "source",
      "channel",
    ]),
    status: firstValue(
      row,
      ["status", "reservation_status"],
      "Pending"
    ),
    totalAmount: Number(
      firstValue(row, [
        "grand_total",
        "total_amount",
        "total",
      ], 0)
    ),
    paidAmount: Number(
      firstValue(row, [
        "paid_amount",
        "advance_amount",
        "advance_paid",
      ], 0)
    ),
  }
}

const columns = [
  {
    accessorKey: "reservationNo",
    header: "Reservation",
    width: 150,
  },
  {
    accessorKey: "guestName",
    header: "Guest",
    width: 220,
  },
  {
    accessorKey: "mobile",
    header: "Mobile",
    width: 150,
  },
  {
    accessorKey: "checkIn",
    header: "Check In",
    type: "date",
    width: 140,
  },
  {
    accessorKey: "checkOut",
    header: "Check Out",
    type: "date",
    width: 140,
  },
  {
    accessorKey: "roomType",
    header: "Room Type",
    width: 160,
  },
  {
    accessorKey: "roomNumber",
    header: "Room",
    width: 110,
  },
  {
    accessorKey: "source",
    header: "Source",
    width: 130,
  },
  {
    accessorKey: "status",
    header: "Status",
    type: "status",
    width: 140,
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    type: "currency",
    aggregation: "sum",
    width: 150,
  },
  {
    accessorKey: "paidAmount",
    header: "Paid",
    type: "currency",
    aggregation: "sum",
    width: 150,
  },
]

export default function ReservationsListTab({
  openReservation,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadReservations = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data, error: queryError } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (queryError) {
      setRows([])
      setError(queryError.message)
      setLoading(false)
      return
    }

    setRows((data || []).map(normalizeReservation))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const gridRows = useMemo(() => rows, [rows])

  return (
    <AedsDataGrid
      title="Reservations"
      subtitle="Live booking register"
      data={gridRows}
      columns={columns}
      pageSize={100}
      loading={loading}
      error={error}
      emptyText="No reservation records found."
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        openReservation?.(row.id)
      }
    />
  )
}
