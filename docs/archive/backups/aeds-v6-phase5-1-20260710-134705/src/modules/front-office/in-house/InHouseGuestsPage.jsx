import FrontOfficeTable from "../shared/FrontOfficeTable"
import StatusPill from "../shared/StatusPill"

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`
}

export default function InHouseGuestsPage({ rows = [], loading = false, openReservation }) {
  const columns = [
    { key: "guestName", label: "Guest", render: (row) => <span className="font-bold text-slate-900">{row.guestName || "Guest"}</span> },
    { key: "roomNumber", label: "Room" },
    { key: "checkIn", label: "Check In" },
    { key: "checkOut", label: "Check Out" },
    { key: "balance", label: "Balance", align: "right", render: (row) => money(row.balance) },
    { key: "status", label: "Status", render: () => <StatusPill status="IN_HOUSE" /> },
  ]

  return (
    <section className="space-y-4">
      <FrontOfficeTable columns={columns} rows={rows} loading={loading} emptyText="No in-house guests found" onOpen={openReservation} />
    </section>
  )
}
