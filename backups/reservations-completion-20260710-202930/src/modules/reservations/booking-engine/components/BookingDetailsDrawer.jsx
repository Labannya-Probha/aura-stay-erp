import { X } from "lucide-react"

export default function BookingDetailsDrawer({
  open,
  reservation,
  canEdit,
  canCancel,
  onClose,
}) {
  if (!open || !reservation) return null

  return (
    <div className="aeds-drawer-overlay">
      <aside className="aeds-drawer">
        <div className="aeds-drawer-header">
          <div>
            <p>Reservation</p>
            <h2>{reservation.guestName}</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="aeds-drawer-body">
          <Info label="Room" value={reservation.roomNumber} />
          <Info label="Stay" value={`${reservation.checkIn} → ${reservation.checkOut}`} />
          <Info label="Status" value={reservation.status} />
          <Info label="Source" value={reservation.source || "-"} />
          <Info label="Balance" value={`৳${Number(reservation.balance || 0).toLocaleString("en-BD")}`} />
        </div>

        <div className="aeds-drawer-actions">
          <button type="button" className="aeds-btn aeds-btn-secondary">Print</button>
          {canEdit && <button type="button" className="aeds-btn aeds-btn-primary">Edit</button>}
          {canCancel && <button type="button" className="aeds-btn aeds-btn-danger">Cancel</button>}
        </div>
      </aside>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="aeds-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
