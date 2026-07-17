import { useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../supabase"
import { withTenantScope } from "../../../lib/companySettings"

export default function GuestFolioPage({ openReservation }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")

    const [{ data: charges, error: chargeError }, { data: payments, error: paymentError }] =
      await Promise.all([
        withTenantScope(
          supabase
            .from("folio_charges")
            .select(`
              id,
              reservation_id,
              charge_date,
              charge_type,
              description,
              total,
              status,
              reservations(
                res_no,
                reservation_name,
                guests:primary_guest_id(full_name),
                reservation_rooms(rooms(room_no))
              )
            `)
            .order("charge_date", { ascending: false })
            .limit(2000)
        ),
        withTenantScope(
          supabase
            .from("payments")
            .select("reservation_id,amount")
        ),
      ])

    if (chargeError || paymentError) {
      setError((chargeError || paymentError).message)
      setRows([])
      setLoading(false)
      return
    }

    const paidByReservation = (payments || []).reduce((map, item) => {
      map[item.reservation_id] =
        Number(map[item.reservation_id] || 0) + Number(item.amount || 0)
      return map
    }, {})

    const totalByReservation = (charges || []).reduce((map, item) => {
      map[item.reservation_id] =
        Number(map[item.reservation_id] || 0) + Number(item.total || 0)
      return map
    }, {})

    setRows((charges || []).map((charge) => {
      const reservation = charge.reservations || {}
      const roomNumbers = (reservation.reservation_rooms || [])
        .map((item) => item.rooms?.room_no)
        .filter(Boolean)
        .join(", ")

      const paid = Number(paidByReservation[charge.reservation_id] || 0)
      const total = Number(totalByReservation[charge.reservation_id] || 0)

      return {
        ...charge,
        reservation_no: reservation.res_no || "—",
        guest_name:
          reservation.reservation_name ||
          reservation.guests?.full_name ||
          "—",
        room_no: roomNumbers || "—",
        folio_total: total,
        paid,
        due: Math.max(0, total - paid),
      }
    }))

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <AedsDataGrid
        title="Guest Folios"
        subtitle="Room, POS, service, tax, payment and outstanding position"
        data={rows}
        columns={[
          { accessorKey: "reservation_no", header: "Reservation No.", width: 180 },
          { accessorKey: "guest_name", header: "Guest Name", width: 220 },
          { accessorKey: "room_no", header: "Room", width: 130 },
          { accessorKey: "charge_date", header: "Date", type: "date", width: 130 },
          { accessorKey: "charge_type", header: "Charge Type", width: 150 },
          { accessorKey: "description", header: "Description", width: 320 },
          { accessorKey: "total", header: "Line Total", type: "currency", aggregation: "sum", width: 150 },
          { accessorKey: "folio_total", header: "Folio Total", type: "currency", width: 150 },
          { accessorKey: "paid", header: "Paid", type: "currency", width: 140 },
          { accessorKey: "due", header: "Due", type: "currency", width: 140 },
          { accessorKey: "status", header: "Status", type: "status", width: 130 },
        ]}
        loading={loading}
        error={error}
        pageSize={100}
        emptyText="No folio transactions found."
        getRowId={(row) => row.id}
        onRowClick={(row) => openReservation?.(row.reservation_id)}
      />
    </div>
  )
}
