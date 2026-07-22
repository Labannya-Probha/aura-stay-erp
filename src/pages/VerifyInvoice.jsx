import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmtBDT, fmtDate } from '../lib/helpers'

function resolveTotals(invoice) {
  const totals = invoice?.totals || {}
  const grand = Number(totals.grand_total ?? invoice?.grand_total ?? 0)
  const paid = Number(invoice?.paid ?? totals.paid ?? 0)
  const due = Number(invoice?.due ?? totals.due ?? Math.max(0, grand - paid))
  return { grand, paid, due }
}

export default function VerifyInvoice() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')

      const query = supabase
        .from('invoices')
        .select('id,invoice_no,reservation_id,issued_at,status,totals,paid,due,is_void,created_at')
        .or(`invoice_no.eq.${id},id.eq.${id}`)
        .limit(1)
        .maybeSingle()

      const { data, error: queryError } = await query
      if (!active) return

      if (queryError || !data) {
        setError('Invoice not found or verification access unavailable.')
      } else {
        setInvoice(data)
      }

      setLoading(false)
    }

    if (id) load()
    return () => { active = false }
  }, [id])

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-pine/60">Verifying invoice...</div>
  }

  if (error || !invoice) {
    return <div className="min-h-screen grid place-items-center px-4 text-sm text-red-600 text-center">{error || 'Invoice not found.'}</div>
  }

  const totals = resolveTotals(invoice)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-3">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-leaf bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold text-pine">Invoice Verification</h1>
          <p className="text-xs text-pine/60">Scanned via secure QR link</p>
        </div>

        <div className="rounded-xl border border-forest/25 bg-forest/5 px-4 py-3 text-sm text-forest font-semibold mb-4">
          Verified: This invoice exists in Aura Stay ERP.
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between"><span className="text-pine/60">Invoice No</span><span className="font-semibold text-pine">{invoice.invoice_no || invoice.id}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Issued Date</span><span>{invoice.issued_at ? fmtDate(invoice.issued_at) : '---'}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Status</span><span>{invoice.status || (invoice.is_void ? 'VOID' : 'ACTIVE')}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Grand Total</span><span className="font-semibold">{fmtBDT(totals.grand)}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Paid</span><span>{fmtBDT(totals.paid)}</span></div>
          <div className="flex justify-between"><span className="text-pine/60">Due</span><span>{fmtBDT(totals.due)}</span></div>
        </div>
      </div>
    </div>
  )
}
