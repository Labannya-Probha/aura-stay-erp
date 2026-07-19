import { useMemo, useState } from 'react'
import { Search, ReceiptText, WalletCards, UserRound } from 'lucide-react'
import { fmtBDT, fmtDate } from '../../../lib/helpers'

export default function GuestFolioPage({ rows = [], loading = false, openReservation }) {
  const [query, setQuery] = useState('')

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => [row.guestName, row.reservationNo, row.roomNumber, row.mobile]
      .some((value) => String(value || '').toLowerCase().includes(needle)))
  }, [query, rows])

  const totalBalance = filteredRows.reduce((sum, row) => sum + Number(row.balance || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={UserRound} label="Open Folios" value={filteredRows.length} />
        <Metric icon={ReceiptText} label="Current Charges" value={fmtBDT(filteredRows.reduce((s, r) => s + Number(r.total || 0), 0))} />
        <Metric icon={WalletCards} label="Outstanding" value={fmtBDT(totalBalance)} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Active guest folios</h2>
            <p className="mt-1 text-sm text-slate-500">Charges, payments and balance for current in-house reservations.</p>
          </div>
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guest, room or reservation"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Guest</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Stay</th>
                <th className="px-4 py-3 text-right">Charges</th><th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">Loading guest folios…</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">No active guest folios found.</td></tr>
              ) : filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3"><div className="font-semibold text-slate-900">{row.guestName}</div><div className="text-xs text-slate-500">{row.reservationNo}</div></td>
                  <td className="px-4 py-3 text-slate-700">{row.roomNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(row.checkIn)} – {fmtDate(row.checkOut)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{fmtBDT(row.total || 0)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{fmtBDT(row.paid || 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtBDT(row.balance || 0)}</td>
                  <td className="px-4 py-3 text-right"><button type="button" onClick={() => openReservation?.(row.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open folio</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><Icon className="h-4 w-4" /></span><div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-lg font-bold text-slate-900">{value}</div></div></div></div>
}
