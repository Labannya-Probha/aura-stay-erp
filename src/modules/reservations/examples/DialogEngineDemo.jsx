import { useAedsDialog } from "../../../components/dialog-engine"

function GuestDrawerContent() {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-black text-slate-950">Ankur Dutta</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">VIP Guest · Deluxe Room · Confirmed</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <strong className="text-sm">Stay Details</strong>
        <p className="mt-2 text-sm text-slate-500">Check-in: 12 Jul 2026 · Check-out: 14 Jul 2026</p>
      </div>
    </div>
  )
}

function BillPreview() {
  return (
    <div className="rounded-2xl bg-white p-6">
      <h1 className="text-2xl font-black">Aura Stay ERP</h1>
      <p className="mt-1 text-sm text-slate-500">Guest Bill Preview</p>
      <table className="mt-6 w-full text-sm">
        <tbody>
          <tr><td>Room Charge</td><td className="text-right">৳12,000</td></tr>
          <tr><td>Restaurant</td><td className="text-right">৳3,500</td></tr>
          <tr><td className="font-black">Total</td><td className="text-right font-black">৳15,500</td></tr>
        </tbody>
      </table>
    </div>
  )
}

export default function DialogEngineDemo() {
  const dialog = useAedsDialog()

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="aeds-dialog-btn primary"
        onClick={() => dialog.drawer({
          title: "Guest Profile",
          description: "Reservation and guest information drawer.",
          size: "lg",
          content: GuestDrawerContent,
        })}
      >
        Open Drawer
      </button>

      <button
        type="button"
        className="aeds-dialog-btn danger"
        onClick={() => dialog.confirm({
          title: "Cancel Reservation?",
          description: "This action will cancel the selected booking.",
          confirmLabel: "Cancel Reservation",
          tone: "danger",
          onConfirm: () => console.log("cancelled"),
        })}
      >
        Confirm Cancel
      </button>

      <button
        type="button"
        className="aeds-dialog-btn"
        onClick={() => dialog.preview({
          title: "Guest Bill Preview",
          description: "Preview invoice before print or export.",
          content: BillPreview,
        })}
      >
        Preview Bill
      </button>

      <button
        type="button"
        className="aeds-dialog-btn"
        onClick={() => dialog.approval({
          title: "Approve Voucher",
          description: "Review this voucher before posting.",
          auditTrail: [
            { label: "Created by Accounts", time: "10:20 AM" },
            { label: "Checked by Manager", time: "10:45 AM" },
          ],
          onApprove: (payload) => console.log("approved", payload),
          onReject: (payload) => console.log("rejected", payload),
        })}
      >
        Approval
      </button>

      <button
        type="button"
        className="aeds-dialog-btn"
        onClick={() => dialog.printPreview({
          title: "Print Guest Bill",
          content: BillPreview,
        })}
      >
        Print Preview
      </button>
    </div>
  )
}
