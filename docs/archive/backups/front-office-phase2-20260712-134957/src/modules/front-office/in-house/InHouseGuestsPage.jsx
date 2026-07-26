import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"

const columns = [
  { accessorKey: "reservationNo", header: "Reservation No.", width: 180 },
  { accessorKey: "guestName", header: "Guest Name", width: 230 },
  { accessorKey: "mobile", header: "Mobile", width: 150 },
  { accessorKey: "roomNumber", header: "Room Number", width: 150 },
  { accessorKey: "roomType", header: "Room Type", width: 190 },
  { accessorKey: "checkIn", header: "Check In", type: "date", width: 140 },
  { accessorKey: "checkOut", header: "Check Out", type: "date", width: 140 },
  { accessorKey: "pax", header: "Pax", type: "number", width: 90 },
  { accessorKey: "source", header: "Source", width: 140 },
  { accessorKey: "total", header: "Folio Total", type: "currency", aggregation: "sum", width: 150 },
  { accessorKey: "paid", header: "Paid", type: "currency", aggregation: "sum", width: 140 },
  { accessorKey: "balance", header: "Due", type: "currency", aggregation: "sum", width: 140 },
  { accessorKey: "status", header: "Status", type: "status", width: 150 },
]

export default function InHouseGuestsPage({
  rows = [],
  loading = false,
  openReservation,
}) {
  return (
    <AedsDataGrid
      title="In-House Guests"
      subtitle="Current guests, assigned rooms and live folio position"
      columns={columns}
      data={rows}
      loading={loading}
      pageSize={100}
      emptyText="No in-house guests found."
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        openReservation?.(row.reservationId)
      }
    />
  )
}
