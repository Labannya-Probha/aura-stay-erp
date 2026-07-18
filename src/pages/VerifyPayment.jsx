import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmtBDT, fmtDate } from '../lib/helpers'
import { parsePaymentReference } from '../lib/paymentNumber'

export default function VerifyPayment() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payment, setPayment] = useState(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')

      const { data, error: queryError } = await supabase
        .from('payments')
        .select('id,payment_id,reservation_id,received_date,amount,method,reference,received_by,paid_by_party,payment_class,created_at,reservations(res_no,reservation_name)')
        .or(`payment_id.eq.${id},id.eq.${id},reference.ilike.%${id}%`)
        .limit(1)
        .maybeSingle()

      if (!active) return

      if (queryError || !data) {
        setError('Payment not found or verification access unavailable.')
      } else {
        setPayment(data)
      }

      setLoading(false)
    }

    if (id) load()
    return () => { active = false }
  }, [id])

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-pine/60">Verifying payment...</div>
  }

  if (error || !payment) {
    return <div className="min-h-screen grid place-items-center px-4 text-sm text-red-600 text-center">{error || 'Payment not found.'}</div>
  }

  const parsed = parsePaymentReference(payment.reference)
  const paymentNo = parsed.paymentNo || payment.payment_id || payment.id

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-3">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-leaf bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold text-pine">Payment Verification</h1>
          <p className="text-xs text-pine/60">Scanned via secure QR link</p>
        </div>

        <div className="rounded-xl border border-forest/25 bg-forest/5 px-4 py-3 text-sm text-forest font-semibold mb-4">
          Verified: This payment receipt exists in Aura Stay ERP.
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between"><span className="text-pine/60">Payment No</span><span className="font-semibold text-pine">{paymentNo}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Reservation</span><span>{payment.reservations?.res_no || '---'}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Guest/Ref</span><span>{payment.reservations?.reservation_name || '---'}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Date</span><span>{payment.received_date ? fmtDate(payment.received_date) : '---'}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Method</span><span>{payment.method || '---'}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Class</span><span>{payment.payment_class || 'SETTLEMENT'}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Paid by</span><span>{payment.paid_by_party || payment.received_by || '---'}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Amount</span><span className="font-semibold">{fmtBDT(Number(payment.amount || 0))}</span></div>
        </div>
      </div>
    </div>
  )
}
