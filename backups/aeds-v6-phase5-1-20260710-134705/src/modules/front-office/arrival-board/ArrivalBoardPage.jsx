import FrontOfficeTable from "../shared/FrontOfficeTable"
import StatusPill from "../shared/StatusPill"

export default function ArrivalBoardPage({ rows = [], loading = false, openReservation }) {
  const columns = [
    { key: "guestName", label: "Guest", render: (row) => <span className="font-bold text-slate-900">{row.guestName || "Guest"}</span> },
    { key: "arrivalTime", label: "Arrival Time" },
    { key: "roomType", label: "Room Type" },
    { key: "roomNumber", label: "Assigned Room" },
    { key: "source", label: "Source" },
    { key: "status", label: "Status", render: () => <StatusPill status="ARRIVAL" /> },
  ]

  return (
    <section className="space-y-4">
      <FrontOfficeTable columns={columns} rows={rows} loading={loading} emptyText="No arrivals found" onOpen={openReservation} />
    </section>
  )
}
