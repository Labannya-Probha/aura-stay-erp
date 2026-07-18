export const PAYMENT_SCOPES = Object.freeze({
  RESERVATION: 'reservation',
  FRONT_OFFICE: 'front-office',
  ACCOUNTING: 'accounting',
  RESTAURANT_POS: 'restaurant-pos',
})

export function applyPaymentScope(query, { scope, reservationId } = {}) {
  switch (scope) {
    case PAYMENT_SCOPES.RESERVATION:
      return reservationId ? query.eq('reservation_id', reservationId) : query
    case PAYMENT_SCOPES.FRONT_OFFICE:
      return query.eq('source_module', 'FRONT_OFFICE')
    case PAYMENT_SCOPES.RESTAURANT_POS:
      return query.eq('source_module', 'RESTAURANT_POS')
    case PAYMENT_SCOPES.ACCOUNTING:
    default:
      return query
  }
}
