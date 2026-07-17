import BookingCalendarEngine from "../booking-engine/BookingCalendarEngine"

export default function BookingCalendarTab({
  company,
  openReservation,
  onNewReservation,
  canCreate = false,
  canEdit = false,
  canCancel = false,
}) {
  return (
    <BookingCalendarEngine
      company={company}
      canCreate={canCreate}
      canEdit={canEdit}
      canCancel={canCancel}
      onNewReservation={onNewReservation}
      onOpenReservation={openReservation}
    />
  )
}
