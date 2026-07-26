import BookingTimelineRoomRow from "./BookingTimelineRoomRow"

export default function BookingTimelineGrid({
  loading,
  days,
  rooms,
  reservations,
  canEdit,
  onSelectReservation,
}) {
  if (loading) {
    return (
      <div className="aeds-timeline-shell">
        <div className="aeds-timeline-loading" />
      </div>
    )
  }

  return (
    <div className="aeds-timeline-shell">
      <div className="aeds-timeline-grid" style={{ "--day-count": days.length }}>
        <div className="aeds-timeline-room-head">Room</div>

        {days.map((day) => (
          <div key={day.iso} className="aeds-timeline-date-head">
            <span>{day.day}</span>
            <small>{day.label}</small>
          </div>
        ))}

        {rooms.map((room) => (
          <BookingTimelineRoomRow
            key={room.id}
            room={room}
            days={days}
            reservations={reservations.filter((r) => r.roomId === room.id)}
            canEdit={canEdit}
            onSelectReservation={onSelectReservation}
          />
        ))}
      </div>
    </div>
  )
}
