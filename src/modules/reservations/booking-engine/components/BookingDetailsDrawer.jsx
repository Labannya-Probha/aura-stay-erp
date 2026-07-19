import { X } from "lucide-react"

export default function BookingDetailsDrawer({
  open,
  reservation,
  canEdit,
  canCancel,
  onClose,
  onEdit,
  onCancel,
}) {
  if (!open || !reservation) return null

  return (
    <div className="aeds-drawer-overlay">
      <aside className="aeds-drawer">
        <div className="aeds-drawer-header">
          <div>
            <p>
              {reservation.reservationNo}
            </p>
            <h2>{reservation.guestName}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="aeds-drawer-body">
          <Info
            label="Guest Phone"
            value={reservation.guestPhone}
          />

          <Info
            label="Customer ID"
            value={reservation.customerId}
          />

          <Info
            label="Room"
            value={`${reservation.roomNumber} · ${reservation.roomName}`}
          />

          <Info
            label="Room Type"
            value={reservation.roomType}
          />

          <Info
            label="Room Rate"
            value={`৳${Number(
              reservation.roomRate || 0
            ).toLocaleString("en-BD")}`}
          />

          <Info
            label="Stay"
            value={`${reservation.checkIn} → ${reservation.checkOut}`}
          />

          <Info
            label="Rooms in Booking"
            value={reservation.roomCount}
          />

          <Info
            label="Pax"
            value={reservation.pax}
          />

          <Info
            label="Status"
            value={reservation.status}
          />

          <Info
            label="Source"
            value={reservation.source || "Direct"}
          />

          <Info
            label="Advance"
            value={
              reservation.advancePaid
                ? "Paid"
                : "Unpaid"
            }
          />
        </div>

        <div className="aeds-drawer-actions">
          {canEdit && (
            <button
              type="button"
              className="aeds-btn aeds-btn-primary"
              onClick={() =>
                onEdit?.(
                  reservation.reservationId
                )
              }
            >
              Edit Reservation
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              className="aeds-btn aeds-btn-danger"
              onClick={() =>
                onCancel?.(
                  reservation.reservationId
                )
              }
            >
              Cancel
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="aeds-info-row">
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  )
}
