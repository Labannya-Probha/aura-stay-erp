import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"

export default function InHouseGuestsPage({
  rows = [],
  loading = false,
  openReservation,
  onRoomMove,
  onStayAmend,
}) {
  return (
    <AedsDataGrid
      title="In-House Guests"
      subtitle="Current guests, assigned rooms and live folio position"
      data={rows}
      columns={[
        { accessorKey: "reservationNo", header: "Reservation No.", width: 180 },
        { accessorKey: "guestName", header: "Guest Name", width: 230 },
        { accessorKey: "mobile", header: "Mobile", width: 150 },
        { accessorKey: "roomNumber", header: "Room Number", width: 150 },
        { accessorKey: "roomType", header: "Room Type", width: 190 },
        { accessorKey: "checkIn", header: "Check In", type: "date", width: 140 },
        { accessorKey: "checkOut", header: "Check Out", type: "date", width: 140 },
        { accessorKey: "total", header: "Folio Total", type: "currency", width: 150 },
        { accessorKey: "paid", header: "Paid", type: "currency", width: 140 },
        { accessorKey: "balance", header: "Due", type: "currency", width: 140 },
        {
          accessorKey: "actions",
          header: "Actions",
          sortable: false,
          width: 250,
          cell: ({ row }) => (
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
                onClick={(event) => {
                  event.stopPropagation()
                  onRoomMove?.(row)
                }}
              >
                Room Move
              </button>

              <button
                type="button"
                className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-800"
                onClick={(event) => {
                  event.stopPropagation()
                  onStayAmend?.(row)
                }}
              >
                Stay Amend
              </button>
            </div>
          ),
        },
      ]}
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
