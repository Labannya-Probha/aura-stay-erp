import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"

const columns = [
  {
    accessorKey: "guestName",
    header: "Guest",
    width: 220,
  },
  {
    accessorKey: "arrivalTime",
    header: "Arrival Time",
    width: 150,
  },
  {
    accessorKey: "roomType",
    header: "Room Type",
    width: 170,
  },
  {
    accessorKey: "roomNumber",
    header: "Assigned Room",
    width: 130,
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
    width: 140,
  },
]

function normalizeRow(row) {
  return {
    ...row,
    status: row.status || "ARRIVAL",
  }
}

export default function ArrivalBoardPage({
  rows = [],
  loading = false,
  openReservation,
}) {
  return (
    <AedsDataGrid
      title="Today's Arrivals"
      subtitle="Expected guest arrivals and room assignments"
      columns={columns}
      data={rows.map(normalizeRow)}
      loading={loading}
      emptyText="No arrivals found."
      getRowId={(row, index) =>
        row.id || row.reservationId || index
      }
      onRowClick={(row) =>
        openReservation?.(
          row.reservationId || row.id
        )
      }
    />
  )
}
