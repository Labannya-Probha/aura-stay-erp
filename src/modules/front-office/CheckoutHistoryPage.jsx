import { useEffect, useState } from 'react'
import { Eye, LogOut, Search } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { withTenantScope } from '../../../lib/companySettings'
import { fmtBDT, fmtDate } from '../../../lib/helpers'
import { Button } from '../../../components/ui/button'

/**
 * New Front Office page: a checked-out guest history was missing
 * entirely from the module (confirmed by inspection — no existing page
 * lists reservations by checkout status). This is purely additive: a
 * new page + a new FRONT_OFFICE_PAGES entry, no existing page touched.
 */
export default function CheckoutHistoryPage({ openReservation }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await withTenantScope(
      supabase
        .from('reservations')
        .select(
          'id, res_no, reservation_name, checked_out_at, check_in, check_out, ' +
            'guests:primary_guest_id(full_name, phone), ' +
            'reservation_rooms(rooms(room_no)), ' +
            'invoices(invoice_no, status, paid, due, totals)',
        )
        .in('status', ['CHECKED_OUT', 'SETTLED'])
        .order('checked_out_at', { ascending: false })
        .limit(200),
    )
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filteredRows = rows.filter((row) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    const roomNos = (row.reservation_rooms || []).map((rr) => rr.rooms?.room_no).join(' ')
    return [row.reservation_name, row.guests?.full_name, row.res_no, roomNos].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(needle),
    )
  })

  return (
    <div className="space-y-4">
      <div className="card p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display font-semibold text-pine text-lg">
            Checked-out Guest History
          </h2>
          <p className="text-sm text-pine/60">
            Recently checked-out reservations, their final bill and invoice status.
          </p>
        </div>
        <label className="relative block w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pine/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest, reservation or room"
            className="input h-10 w-full pl-9"
          />
        </label>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Guest</th>
              <th className="th">Reservation</th>
              <th className="th">Room</th>
              <th className="th">Checked Out</th>
              <th className="th">Invoice</th>
              <th className="th text-right">Paid</th>
              <th className="th text-right">Due</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="td text-pine/40" colSpan={8}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filteredRows.length === 0 && (
              <tr>
                <td className="td text-pine/40" colSpan={8}>
                  No checked-out guests found.
                </td>
              </tr>
            )}
            {filteredRows.map((row) => {
              const invoice = row.invoices?.[0]
              const roomNos = (row.reservation_rooms || [])
                .map((rr) => rr.rooms?.room_no)
                .filter(Boolean)
                .join(', ')
              return (
                <tr key={row.id}>
                  <td className="td text-sm font-medium">
                    {row.reservation_name || row.guests?.full_name || '—'}
                  </td>
                  <td className="td text-xs font-mono">{row.res_no}</td>
                  <td className="td text-xs">{roomNos || '—'}</td>
                  <td className="td text-xs">
                    {row.checked_out_at ? fmtDate(row.checked_out_at) : '—'}
                  </td>
                  <td className="td text-xs">
                    {invoice ? (
                      <span
                        className={`status-chip ${invoice.status === 'PAID' ? 'bg-forest/15 text-forest' : 'bg-amber/20 text-amber'}`}
                      >
                        {invoice.invoice_no}
                      </span>
                    ) : (
                      <span className="status-chip bg-red-100 text-red-700">No invoice</span>
                    )}
                  </td>
                  <td className="td text-right text-xs money">
                    {invoice ? fmtBDT(invoice.paid) : '—'}
                  </td>
                  <td className="td text-right text-xs money">
                    {invoice ? fmtBDT(invoice.due) : '—'}
                  </td>
                  <td className="td">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openReservation?.(row.id)}
                      aria-label={`Open ${row.res_no}`}
                    >
                      <Eye size={14} />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
