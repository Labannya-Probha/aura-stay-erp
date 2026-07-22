import express from 'express'
import { requireAuth, supabaseAdmin } from '../middleware/auth.js'

const router = express.Router()

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (error) {
    next(error)
  }
}

const toReceiptDate = (value) => {
  if (!value) return null
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10)
}

router.use(requireAuth())

router.get(
  '/money-receipts/:receiptId',
  asyncRoute(async (req, res) => {
    const receiptId = String(req.params.receiptId || '').trim()
    if (!receiptId) {
      return res.status(400).json({ error: 'receipt_id is required', code: 400 })
    }

    const tenantId = req.authUser.tenantId

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select(
        `
          id,
          tenant_id,
          payment_id,
          reservation_id,
          received_date,
          amount,
          method,
          reference,
          received_by,
          payment_class,
          balance_due,
          due_amount,
          reservations(
            id,
            res_no,
            reservation_name,
            check_in,
            check_out,
            balance,
            guests:primary_guest_id(full_name),
            reservation_rooms(rooms(room_no))
          )
        `,
      )
      .eq('tenant_id', tenantId)
      .eq('id', receiptId)
      .maybeSingle()

    if (paymentError) {
      return res
        .status(500)
        .json({ error: paymentError.message || 'Failed to load payment', code: 500 })
    }

    if (!payment) {
      return res.status(404).json({ error: 'Receipt not found for this tenant', code: 404 })
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from('company_settings')
      .select(
        'tenant_id,company_name,name,address,phone,email,tin,bin,logo_url,primary_color,accent_color',
      )
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle()

    if (companyError) {
      return res
        .status(500)
        .json({ error: companyError.message || 'Failed to load company settings', code: 500 })
    }

    const amount = Number(payment.amount || 0)
    const balanceDue = Number(
      payment.balance_due ?? payment.due_amount ?? payment.reservations?.balance ?? 0,
    )

    const payload = {
      tenant_id: tenantId,
      company: {
        name: company?.company_name || company?.name || null,
        address: company?.address || 'Bishamoni, Radhanagar, Sreemangal, Moulvibazar',
        phone: company?.phone || null,
        email: company?.email || null,
        bin_tin: company?.tin || company?.bin || null,
        logo_url: company?.logo_url || null,
      },
      receipt: {
        receipt_id: payment.id,
        receipt_no: payment.payment_id || payment.id,
        date: toReceiptDate(payment.received_date),
        received_by: payment.received_by || 'Accounts User',
        payment_class: payment.payment_class || 'REGULAR',
      },
      guest_stay: {
        guest_name:
          payment.reservations?.reservation_name || payment.reservations?.guests?.full_name || null,
        reservation_id: payment.reservations?.res_no || payment.reservation_id || null,
        folio_no: payment.reservations?.res_no || payment.reservation_id || null,
        room_no:
          (payment.reservations?.reservation_rooms || [])
            .map((row) => row?.rooms?.room_no)
            .filter(Boolean)
            .join(', ') || null,
        check_in: toReceiptDate(payment.reservations?.check_in),
        check_out: toReceiptDate(payment.reservations?.check_out),
      },
      lines: [
        {
          description: 'Reservation Folio Payment',
          payment_mode: payment.method || 'CARD',
          amount,
        },
      ],
      totals: {
        total_received: amount,
        balance_due: balanceDue,
        status: balanceDue > 0 ? 'Balance Due' : 'Paid in Full',
      },
    }

    return res.json(payload)
  }),
)

router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    error: error.message || 'Money receipt service failed',
    code: error.status || 500,
  })
})

export default router
