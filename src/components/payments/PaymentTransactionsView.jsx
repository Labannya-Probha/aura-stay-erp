import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fmtBDT, fmtDate } from '../../lib/helpers'
import { applyPaymentScope, PAYMENT_SCOPES } from './paymentScope'

export default function PaymentTransactionsView({
  scope = PAYMENT_SCOPES.ACCOUNTING,
  reservationId = null,
  refreshKey = 0,
  limit = 500,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    let query = supabase
      .from('payments')
      .select('id,payment_id,reservation_id,received_date,amount,method,reference,received_by,payment_class,source_module,card_type,cheque_number,cheque_date,bank_account_id,reservations(res_no,reservation_name)')
      .order('received_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    query = applyPaymentScope(query, { scope, reservationId })
    const { data, error: queryError } = await query
    setRows(queryError ? [] : (data || []))
    setError(queryError?.message || '')
    setLoading(false)
  }, [limit, reservationId, scope])

  useEffect(() => { load() }, [load, refreshKey])

  const total = useMemo(() => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0), [rows])

  return (
    <section className="rounded-xl border border-pine/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pine/10 px-4 py-3">
        <div>
          <h3 className="font-semibold text-pine">Payment Transactions</h3>
          <p className="text-xs text-pine/60">Context-filtered payment ledger</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-pine/50">Visible total</div>
          <div className="font-mono font-semibold text-pine">{fmtBDT(total)}</div>
        </div>
      </div>

      {error && <div className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-cream/70 text-left text-xs uppercase tracking-wide text-pine/60">
            <tr>
              <th className="px-4 py-3">Payment ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Reservation</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pine/10">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-mono text-xs">{row.payment_id || 'Pending'}</td>
                <td className="px-4 py-3">{fmtDate(row.received_date)}</td>
                <td className="px-4 py-3">{row.reservations?.res_no || '—'}</td>
                <td className="px-4 py-3">{row.source_module || 'LEGACY'}</td>
                <td className="px-4 py-3">{row.method || '—'}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{fmtBDT(Number(row.amount || 0))}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-pine/50">No payment transactions found.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-pine/50">Loading payments…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
