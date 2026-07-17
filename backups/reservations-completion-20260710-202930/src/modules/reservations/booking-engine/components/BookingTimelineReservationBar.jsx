const STATUS_CLASS = {
  CONFIRMED: "confirmed",
  TENTATIVE: "tentative",
  CHECKED_IN: "checked-in",
  BLOCKED: "blocked",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
}

export default function BookingTimelineReservationBar({
  reservation,
  placement,
  canEdit,
  onClick,
}) {
  const statusClass = STATUS_CLASS[reservation.status] || "confirmed"

  return (
    <button
      type="button"
      onClick={onClick}
      draggable={canEdit}
      className={`aeds-reservation-bar ${statusClass}`}
      style={{
        left: `calc(${placement.startIndex} * var(--day-width) + 6px)`,
        width: `calc(${placement.span} * var(--day-width) - 12px)`,
      }}
      title={`${reservation.guestName} · ${reservation.status}`}
    >
      <strong>{reservation.guestName}</strong>
      <span>{reservation.source || reservation.status}</span>
    </button>
  )
}
