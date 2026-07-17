import BookingTimelineRoomRow from "./BookingTimelineRoomRow"
import { getGovtHoliday } from "../../../../lib/govtHolidays"

export default function BookingTimelineGrid({
  loading,
  days,
  rooms,
  reservations,
  canEdit,
  onSelectReservation,
  onMoveReservation,
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
      <div
        className="aeds-timeline-grid"
        style={{ "--day-count": days.length }}
      >
        <div className="aeds-timeline-room-head">
          Room Master
        </div>

        {days.map((day) => {
          const holidayName = getGovtHoliday(day.iso)
          const isHoliday = Boolean(holidayName)
          const headClass = [
            "aeds-timeline-date-head",
            day.isWeekend ? "is-weekend" : "",
            isHoliday ? "is-holiday" : "",
          ]
            .filter(Boolean)
            .join(" ")

          return (
            <div
              key={day.iso}
              className={headClass}
              title={isHoliday ? `${day.iso} — ${holidayName} (Govt. Holiday)` : day.iso}
            >
              <span>{day.day}</span>
              <small>{day.label}</small>
              {isHoliday && <em className="aeds-timeline-holiday-dot" />}
            </div>
          )
        })}

        {rooms.map((room) => (
          <BookingTimelineRoomRow
            key={room.id}
            room={room}
            days={days}
            reservations={reservations.filter(
              (reservation) =>
                reservation.roomId === room.id
            )}
            canEdit={canEdit}
            onSelectReservation={
              onSelectReservation
            }
            onMoveReservation={
              onMoveReservation
            }
          />
        ))}
      </div>
    </div>
  )
}
