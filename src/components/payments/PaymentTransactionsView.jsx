import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fmtBDT, fmtDate } from '../../lib/helpers'
import { applyPaymentScope, PAYMENT_SCOPES } from './paymentScope'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

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
    <section className="rounded-2xl border border-pine/10 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pine/10 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-pine">Payment Transactions</h3>
          <p className="text-xs text-pine/60">Context-filtered payment ledger</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-pine/50">Visible total</div>
          <div className="font-mono font-semibold text-pine">{fmtBDT(total)}</div>
        </div>
      </div>

      {error && <div className="mx-5 mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto px-2 pb-2">
        <Table>
          <TableHeader className="bg-cream/70 text-left text-xs uppercase tracking-[0.14em] text-pine/60">
            <tr>
              <TableHead className="px-4 py-3 font-semibold">Payment ID</TableHead>
              <TableHead className="px-4 py-3 font-semibold">Date</TableHead>
              <TableHead className="px-4 py-3 font-semibold">Reservation</TableHead>
              <TableHead className="px-4 py-3 font-semibold">Source</TableHead>
              <TableHead className="px-4 py-3 font-semibold">Method</TableHead>
              <TableHead className="px-4 py-3 text-right font-semibold">Amount</TableHead>
            </tr>
          </TableHeader>
          <TableBody className="divide-y divide-pine/10">
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-3 font-mono text-xs">{row.payment_id || 'Pending'}</TableCell>
                <TableCell className="px-4 py-3">{fmtDate(row.received_date)}</TableCell>
                <TableCell className="px-4 py-3">{row.reservations?.res_no || '—'}</TableCell>
                <TableCell className="px-4 py-3">{row.source_module || 'LEGACY'}</TableCell>
                <TableCell className="px-4 py-3">{row.method || '—'}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono font-semibold">{fmtBDT(Number(row.amount || 0))}</TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="px-4 py-8 text-center text-pine/50">No payment transactions found.</TableCell></TableRow>
            )}
            {loading && (
              <TableRow><TableCell colSpan={6} className="px-4 py-8 text-center text-pine/50">Loading payments…</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
