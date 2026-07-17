import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"

const columns = [
  {
    accessorKey: "guestName",
    header: "Guest",
    width: 220,
  },
  {
    accessorKey: "roomNumber",
    header: "Room",
    width: 110,
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
    accessorKey: "balance",
    header: "Balance",
    type: "currency",
    aggregation: "sum",
    width: 150,
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
    balance: Number(row.balance || 0),
    status: row.status || "IN_HOUSE",
  }
}

export default function InHouseGuestsPage({
  rows = [],
  loading = false,
  openReservation,
}) {
  return (
    <AedsDataGrid
      title="In-House Guests"
      subtitle="Current occupied rooms, stay dates and folio balances"
      columns={columns}
      data={rows.map(normalizeRow)}
      loading={loading}
      emptyText="No in-house guests found."
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
