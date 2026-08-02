export function buildCheckoutBillPayload({
  reservation,
  charges = [],
  payments = [],
  company,
  guest,
  issuedAt,
  invoiceNo,
}) {
  const computedTotal = (charges || []).reduce((sum, charge) => sum + Number(charge.total || 0), 0)
  const computedPaid = (payments || []).reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  )
  const computedDue = Math.max(0, computedTotal - computedPaid)

  const totals = {
    base: computedTotal,
    discount: 0,
    service_charge: 0,
    vat: 0,
    grand_total: computedTotal,
    grand_total_raw: computedTotal,
  }

  return {
    type: 'BILL',
    phase: 'GUEST',
    totals,
    paid: computedPaid,
    due: computedDue,
    invoiceData: {
      charges,
      line_snapshot: [],
      totals,
      paid: computedPaid,
      due: computedDue,
      invoice_no:
        invoiceNo || `INV-${reservation?.reservationNo || reservation?.reservationId || 'CHK'}`,
      issued_at: issuedAt || new Date().toISOString(),
    },
    res: {
      res_no: reservation?.reservationNo,
      reservation_name: reservation?.guestName,
      guest_name: reservation?.guestName,
      check_in: reservation?.checkIn,
      check_out: reservation?.checkOut,
      folio_no: reservation?.reservationNo,
      room_no: reservation?.roomNumber,
      pax_adults: reservation?.pax || 0,
      pax_children: 0,
    },
    guest: {
      full_name: guest?.full_name || reservation?.guestName,
      phone: guest?.phone || reservation?.mobile,
      email: guest?.email || '',
      guest_code: guest?.guest_code || guest?.id || '',
      id: guest?.id || '',
    },
    company,
  }
}
