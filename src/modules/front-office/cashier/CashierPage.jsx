import ReservationPayments from "../../../pages/ReservationPayments"

export default function CashierPage({ userName, isAdmin }) {
  return (
    <ReservationPayments
      userName={userName}
      isAdmin={isAdmin}
    />
  )
}
