import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"

const columns = [
  { accessorKey: "reservationNo", header: "Reservation No.", width: 180 },
  { accessorKey: "guestName", header: "Guest Name", width: 230 },
  { accessorKey: "mobile", header: "Mobile", width: 150 },
  { accessorKey: "arrivalTime", header: "Arrival Time", width: 140 },
  { accessorKey: "roomNumber", header: "Room Number", width: 150 },
  { accessorKey: "roomType", header: "Room Type", width: 190 },
  { accessorKey: "roomCount", header: "Rooms", type: "number", width: 100 },
  { accessorKey: "pax", header: "Pax", type: "number", width: 90 },
  { accessorKey: "source", header: "Source", width: 140 },
  { accessorKey: "paid", header: "Paid", type: "currency", aggregation: "sum", width: 140 },
  { accessorKey: "balance", header: "Due", type: "currency", aggregation: "sum", width: 140 },
  { accessorKey: "status", header: "Status", type: "status", width: 150 },
]

export default function ArrivalBoardPage({
  rows = [],
  loading = false,
  openReservation,
}) {
  return (
    <AedsDataGrid
      title="Today's Arrivals"
      subtitle="Expected arrivals, room assignment, payment and guest contact position"
      columns={columns}
      data={rows}
      loading={loading}
      pageSize={100}
      emptyText="No arrivals found."
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        openReservation?.(row.reservationId)
      }
    />
  )
}
