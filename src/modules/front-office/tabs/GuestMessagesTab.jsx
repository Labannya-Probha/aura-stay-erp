import FrontOfficeReservationQueue from '../components/FrontOfficeReservationQueue'

export default function GuestMessagesTab({ openReservation }) {
  return (
    <FrontOfficeReservationQueue
      title="Guest Messages"
      description="Guests with active or arriving reservations."
      empty="No active guest message recipients are available."
      openReservation={openReservation}
      targetTab="Overview"
      filter={(row, today) => row.status === 'CHECKED_IN' || row.check_in === today}
    />
  )
}
