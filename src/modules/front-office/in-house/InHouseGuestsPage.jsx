import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"

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
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation()
                  onRoomMove?.(row)
                }}
              >
                Room Move
              </Button>

              <Button
                type="button"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation()
                  onStayAmend?.(row)
                }}
              >
                Stay Amend
              </Button>
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
