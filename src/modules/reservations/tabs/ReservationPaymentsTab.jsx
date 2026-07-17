import ReservationPayments from "../../../pages/ReservationPayments"

export default function ReservationPaymentsTab({
  userName,
  isAdmin,
}) {
  return (
    <ReservationPayments
      userName={userName}
      isAdmin={isAdmin}
    />
  )
}
