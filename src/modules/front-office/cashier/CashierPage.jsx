import ReservationPayments from '../../../pages/ReservationPayments.jsx'
import { PAYMENT_SCOPES } from '../../../components/payments/paymentScope.js'

export default function CashierPage({ userName, isAdmin }) {
  return <ReservationPayments userName={userName} isAdmin={isAdmin} scope={PAYMENT_SCOPES.FRONT_OFFICE} sourceModule="FRONT_OFFICE" />
}
