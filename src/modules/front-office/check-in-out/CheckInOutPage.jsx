import ArrivalBoardPage from "../arrival-board/ArrivalBoardPage"
import DepartureBoardPage from "../departure-board/DepartureBoardPage"

export default function CheckInOutPage({
  arrivals,
  departures,
  loading,
  openReservation,
  onCheckIn,
  onCheckOut,
}) {
  return (
    <div className="space-y-5">
      <ArrivalBoardPage
        rows={arrivals}
        loading={loading}
        openReservation={openReservation}
        onCheckIn={onCheckIn}
      />

      <DepartureBoardPage
        rows={departures}
        loading={loading}
        openReservation={openReservation}
        onCheckOut={onCheckOut}
      />
    </div>
  )
}
