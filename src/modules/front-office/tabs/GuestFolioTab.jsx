import FrontOfficeReservationQueue from '../components/FrontOfficeReservationQueue'

export default function GuestFolioTab({ openReservation }) {
  return (
    <FrontOfficeReservationQueue
      title="Guest Folio"
      description="Active guest accounts routed to the existing folio and payment workflow."
      empty="No active guest folios are open."
      openReservation={openReservation}
      targetTab="Billings & Check-Out"
      filter={(row) => row.status === 'CHECKED_IN'}
    />
  )
}
