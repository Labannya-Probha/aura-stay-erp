const STATUS_CLASS = {
  QUERY: "query",
  QUOTED: "quoted",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked-in",
  CHECKED_OUT: "checked-out",
  SETTLED: "settled",
  NO_SHOW: "no-show",
}

export default function BookingTimelineReservationBar({
  reservation,
  placement,
  canEdit,
  onClick,
}) {
  const statusClass =
    STATUS_CLASS[reservation.status] ||
    "confirmed"

  return (
    <button
      type="button"
      onClick={onClick}
      draggable={canEdit}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move"
        event.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            assignmentId:
              reservation.assignmentId,
            reservationId:
              reservation.reservationId,
            roomId: reservation.roomId,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
          })
        )
      }}
      className={`aeds-reservation-bar ${statusClass}`}
      style={{
        left: `calc(${placement.startIndex} * var(--day-width) + 4px)`,
        width: `calc(${placement.span} * var(--day-width) - 8px)`,
      }}
      title={[
        reservation.guestName,
        reservation.reservationNo,
        reservation.guestPhone,
        `${reservation.roomNumber} · ${reservation.roomName}`,
        `${reservation.checkIn} → ${reservation.checkOut}`,
        reservation.advancePaid
          ? "Advance Paid"
          : "Advance Unpaid",
        reservation.status,
      ].join("\n")}
    >
      <strong>{reservation.guestName}</strong>
      <span>
        {reservation.reservationNo} ·{" "}
        {reservation.roomNumber}
      </span>
      <small>
        {reservation.advancePaid
          ? "Paid ✓"
          : "Unpaid"}{" "}
        · {reservation.source}
      </small>
    </button>
  )
}
