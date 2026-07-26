import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"

export default function ArrivalBoardPage({
  rows = [],
  loading = false,
  openReservation,
  onCheckIn,
}) {
  return (
    <AedsDataGrid
      title="Today's Arrivals"
      subtitle="Expected arrivals, room assignment, payment and guest contact position"
      data={rows}
      columns={[
        { accessorKey: "reservationNo", header: "Reservation No.", width: 180 },
        { accessorKey: "guestName", header: "Guest Name", width: 230 },
        { accessorKey: "mobile", header: "Mobile", width: 150 },
        { accessorKey: "roomNumber", header: "Room Number", width: 150 },
        { accessorKey: "roomType", header: "Room Type", width: 190 },
        { accessorKey: "pax", header: "Pax", type: "number", width: 90 },
        { accessorKey: "paid", header: "Paid", type: "currency", width: 140 },
        { accessorKey: "balance", header: "Due", type: "currency", width: 140 },
        { accessorKey: "status", header: "Status", type: "status", width: 150 },
        {
          accessorKey: "actions",
          header: "Actions",
          sortable: false,
          width: 170,
          cell: ({ row }) => (
            <button
              type="button"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-800"
              onClick={(event) => {
                event.stopPropagation()
                onCheckIn?.(row)
              }}
            >
              Check In
            </button>
          ),
        },
      ]}
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
