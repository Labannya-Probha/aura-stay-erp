import BookingTimelineReservationBar from "./BookingTimelineReservationBar"
import { getReservationGridPlacement } from "../utils/timelinePlacement"

export default function BookingTimelineRoomRow({
  room,
  days,
  reservations,
  canEdit,
  onSelectReservation,
  onMoveReservation,
}) {
  return (
    <>
      <div className="aeds-timeline-room-cell">
        <strong>{room.number}</strong>
        <span>{room.name}</span>
        <small>{room.type}</small>
        <em>
          ৳{Number(room.baseRate || 0).toLocaleString("en-BD")}
        </em>
      </div>

      <div
        className="aeds-timeline-room-track"
        style={{
          gridColumn: `2 / span ${days.length}`,
        }}
      >
        {days.map((day) => (
          <div
            key={day.iso}
            className="aeds-timeline-day-cell"
            onDragOver={(event) => {
              if (!canEdit) return
              event.preventDefault()
              event.dataTransfer.dropEffect = "move"
            }}
            onDrop={(event) => {
              if (!canEdit) return

              event.preventDefault()

              try {
                const payload = JSON.parse(
                  event.dataTransfer.getData(
                    "application/json"
                  )
                )

                onMoveReservation?.({
                  reservation: {
                    assignmentId:
                      payload.assignmentId,
                    reservationId:
                      payload.reservationId,
                    checkIn: payload.checkIn,
                    checkOut: payload.checkOut,
                  },
                  targetRoomId: room.id,
                  targetStartDate: day.iso,
                })
              } catch (error) {
                console.error(
                  "Invalid reservation drag payload:",
                  error
                )
              }
            }}
          />
        ))}

        {reservations.map((reservation) => {
          const placement =
            getReservationGridPlacement(
              reservation,
              days
            )

          if (!placement) return null

          return (
            <BookingTimelineReservationBar
              key={reservation.assignmentId}
              reservation={reservation}
              placement={placement}
              canEdit={canEdit}
              onClick={() =>
                onSelectReservation(reservation)
              }
            />
          )
        })}
      </div>
    </>
  )
}
