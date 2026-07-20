import { useMemo, useState } from "react"
import { AlertTriangle, CalendarDays, RefreshCw, ShieldCheck } from "lucide-react"
import { useAvailability } from "../hooks/useAvailability"

function isoDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function InventoryBar({ available, physical }) {
  const denominator = Math.max(1, Number(physical || 0))
  const pct = Math.max(0, Math.min(100, (Number(available || 0) / denominator) * 100))
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${available} rooms available`}>
      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function AvailabilityPage({ onCreateReservation }) {
  const [checkIn, setCheckIn] = useState(isoDate(0))
  const [checkOut, setCheckOut] = useState(isoDate(1))
  const [quantity, setQuantity] = useState(1)
  const criteria = useMemo(() => ({ checkIn, checkOut, quantity }), [checkIn, checkOut, quantity])
  const { data, loading, error, refresh } = useAvailability(criteria)

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-950">
              <CalendarDays size={20} />
              <h2 className="text-xl font-black">Live Availability Matrix</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">Physical inventory, out-of-order rooms, controlled overbooking and selling restrictions.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
            <label className="text-xs font-bold text-slate-600">Check-in
              <input className="input mt-1" type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
            </label>
            <label className="text-xs font-bold text-slate-600">Check-out
              <input className="input mt-1" type="date" min={checkIn} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
            </label>
            <label className="text-xs font-bold text-slate-600">Rooms required
              <input className="input mt-1" type="number" min="1" max="50" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))} />
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div><strong>Availability could not be loaded.</strong><div className="mt-1">{error.message}</div></div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-bold text-slate-700">{loading ? "Checking inventory…" : `${data.length} room type(s) evaluated`}</div>
          <button type="button" className="btn-ghost text-sm" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Room type</th><th className="px-5 py-3">Physical</th><th className="px-5 py-3">Minimum available</th><th className="px-5 py-3">Restrictions</th><th className="px-5 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && data.length === 0 && <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-500">No room inventory matched this stay period.</td></tr>}
              {data.map((row) => {
                const canSell = Boolean(row.can_sell)
                const restrictions = row.restrictions || {}
                return (
                  <tr key={row.room_type_key} className="align-top">
                    <td className="px-5 py-4"><div className="font-black text-slate-950">{row.room_type_key}</div><div className="mt-2 w-40"><InventoryBar available={row.minimum_available} physical={row.physical_rooms} /></div></td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{row.physical_rooms}</td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${canSell ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{row.minimum_available} available</span></td>
                    <td className="px-5 py-4 text-xs text-slate-600">{row.stop_sell ? "Stop sell" : `Min ${restrictions.minStay || 1} night(s)`}{restrictions.cta ? " · CTA" : ""}{restrictions.ctd ? " · CTD" : ""}</td>
                    <td className="px-5 py-4 text-right"><button type="button" disabled={!canSell} onClick={() => onCreateReservation?.({ checkIn, checkOut, roomType: row.room_type_key, quantity })} className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-40"><ShieldCheck size={15} /> Reserve</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
