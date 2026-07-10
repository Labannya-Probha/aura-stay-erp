import FrontOfficeTable from "../shared/FrontOfficeTable"
import StatusPill from "../shared/StatusPill"

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`
}

export default function DepartureBoardPage({ rows = [], loading = false, openReservation }) {
  const columns = [
    { key: "guestName", label: "Guest", render: (row) => <span className="font-bold text-slate-900">{row.guestName || "Guest"}</span> },
    { key: "roomNumber", label: "Room" },
    { key: "departureTime", label: "Departure Time" },
    { key: "balance", label: "Balance", align: "right", render: (row) => money(row.balance) },
    { key: "status", label: "Status", render: (row) => <StatusPill status={Number(row.balance || 0) > 0 ? "DUE" : "DEPARTURE"} /> },
  ]

  return (
    <section className="space-y-4">
      <FrontOfficeTable columns={columns} rows={rows} loading={loading} emptyText="No departures found" onOpen={openReservation} />
    </section>
  )
}
