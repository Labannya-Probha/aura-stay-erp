import { CheckCircle2, RefreshCw, ShieldCheck, XCircle } from "lucide-react"
import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { useReservationWorkflow } from "../hooks/useReservationWorkflow"
import { decideReservationApproval } from "../services/reservationWorkflow.service"

export default function ReservationWorkflowTab() {
  const { approvals, loading, error, refresh } = useReservationWorkflow()

  async function decide(id, decision) {
    await decideReservationApproval(id, decision)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="aeds-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><ShieldCheck size={21} /></div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Reservation Workflow & Approvals</h2>
            <p className="text-sm text-slate-500">Rate overrides, discounts, complimentary stays, upgrades and late checkout controls.</p>
          </div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</Button>
      </div>

      <AedsDataGrid
        title="Pending Reservation Approvals"
        subtitle="Maker-checker control for sensitive reservation operations"
        data={approvals}
        loading={loading}
        error={error}
        emptyText="No pending reservation approvals."
        getRowId={(row) => row.id}
        columns={[
          { accessorKey: "created_at", header: "Requested", type: "date", width: 170 },
          { accessorKey: "reservation_id", header: "Reservation", width: 220 },
          { accessorKey: "approval_type", header: "Approval Type", width: 190 },
          { accessorKey: "reason", header: "Reason", width: 300 },
          { accessorKey: "status", header: "Status", type: "status", width: 120 },
          {
            id: "actions",
            header: "Actions",
            width: 220,
            cell: ({ row }) => (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(row.original.id, "APPROVED")}><CheckCircle2 size={14} />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(row.original.id, "REJECTED")}><XCircle size={14} />Reject</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
