import BookingTimelineReservationBar from "./BookingTimelineReservationBar"
import { getReservationGridPlacement } from "../utils/timelinePlacement"

export default function BookingTimelineRoomRow({
  room,
  days,
  reservations,
  canEdit,
  onSelectReservation,
}) {
  return (
    <>
      <div className="aeds-timeline-room-cell">
        <strong>{room.number}</strong>
        <span>{room.type}</span>
      </div>

      <div className="aeds-timeline-room-track" style={{ gridColumn: `2 / span ${days.length}` }}>
        {days.map((day) => (
          <div key={day.iso} className="aeds-timeline-day-cell" />
        ))}

        {reservations.map((reservation) => {
          const placement = getReservationGridPlacement(reservation, days)
          if (!placement) return null

          return (
            <BookingTimelineReservationBar
              key={reservation.id}
              reservation={reservation}
              placement={placement}
              canEdit={canEdit}
              onClick={() => onSelectReservation(reservation)}
            />
          )
        })}
      </div>
    </>
  )
}
