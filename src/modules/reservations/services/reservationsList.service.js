import { supabase } from "../../../lib/supabase"
import { withTenantScope } from "../../../lib/companySettings"

const RESERVATION_SELECT = `
  id,
  res_no,
  reservation_name,
  status,
  check_in,
  check_out,
  pax_adults,
  pax_children,
  source,
  created_at,
  guests:primary_guest_id(
    id,
    full_name,
    phone,
    customer_id
  ),
  reservation_rooms(
    id,
    room_id,
    from_date,
    to_date,
    rooms(
      id,
      room_no,
      room_name
    )
  )
`

function sumByReservation(rows, valueKey) {
  return (rows || []).reduce((totals, row) => {
    if (!row.reservation_id) return totals

    totals[row.reservation_id] =
      Number(totals[row.reservation_id] || 0) +
      Number(row[valueKey] || 0)

    return totals
  }, {})
}

export async function getReservationsRegister({
  limit = 1000,
} = {}) {
  const { data: reservations, error: reservationError } =
    await withTenantScope(
      supabase
        .from("reservations")
        .select(RESERVATION_SELECT)
        .order("created_at", { ascending: false })
        .limit(limit)
    )

  if (reservationError) throw reservationError

  const reservationIds = (reservations || [])
    .map((reservation) => reservation.id)
    .filter(Boolean)

  if (reservationIds.length === 0) return []

  const [
    { data: charges, error: chargesError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    withTenantScope(
      supabase
        .from("folio_charges")
        .select("reservation_id,total")
        .in("reservation_id", reservationIds)
    ),
    withTenantScope(
      supabase
        .from("payments")
        .select("reservation_id,amount")
        .in("reservation_id", reservationIds)
    ),
  ])

  if (chargesError) {
    console.warn(
      "Reservation folio totals unavailable:",
      chargesError.message
    )
  }

  if (paymentsError) {
    console.warn(
      "Reservation payment totals unavailable:",
      paymentsError.message
    )
  }

  const chargeTotals = sumByReservation(charges, "total")
  const paymentTotals = sumByReservation(payments, "amount")

  return (reservations || []).map((reservation) => ({
    ...reservation,
    folio_total: Number(chargeTotals[reservation.id] || 0),
    paid_total: Number(paymentTotals[reservation.id] || 0),
  }))
}
