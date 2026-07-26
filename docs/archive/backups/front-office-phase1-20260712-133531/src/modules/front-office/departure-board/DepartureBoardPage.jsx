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
    accessorKey: "departureTime",
    header: "Departure Time",
    width: 160,
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
  const balance = Number(row.balance || 0)

  return {
    ...row,
    balance,
    status:
      row.status ||
      (balance > 0 ? "DUE" : "DEPARTURE"),
  }
}

export default function DepartureBoardPage({
  rows = [],
  loading = false,
  openReservation,
}) {
  return (
    <AedsDataGrid
      title="Today's Departures"
      subtitle="Expected check-outs and outstanding folio balances"
      columns={columns}
      data={rows.map(normalizeRow)}
      loading={loading}
      emptyText="No departures found."
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
