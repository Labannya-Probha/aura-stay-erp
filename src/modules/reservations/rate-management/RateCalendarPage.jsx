import { useMemo, useState } from "react"
import { BadgePercent, CalendarRange, Calculator } from "lucide-react"
import { priceStay } from "../domain/rateEngine"

function isoDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

export default function RateCalendarPage() {
  const [form, setForm] = useState({ checkIn: isoDate(), checkOut: isoDate(2), baseRate: 7000, adults: 2, children: 0 })
  const quote = useMemo(() => priceStay({
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    baseRate: form.baseRate,
    rules: [{ code: "WEEKEND", name: "Weekend supplement", adjustmentType: "PERCENT", value: 10, daysOfWeek: [5, 6], priority: 10 }],
    guests: { adults: form.adults, children: form.children, includedAdults: 2, includedChildren: 0, extraAdultRate: 1500, extraChildRate: 800 },
  }), [form])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><BadgePercent size={20} /><h2 className="text-xl font-black text-slate-950">Rate Plan Simulator</h2></div>
        <p className="mt-1 text-sm text-slate-500">Nightly pricing with seasonal, weekday, occupancy and extra-guest rules.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-bold text-slate-600">Check-in<input className="input mt-1" type="date" value={form.checkIn} onChange={(e) => update("checkIn", e.target.value)} /></label>
          <label className="text-xs font-bold text-slate-600">Check-out<input className="input mt-1" type="date" min={form.checkIn} value={form.checkOut} onChange={(e) => update("checkOut", e.target.value)} /></label>
          <label className="text-xs font-bold text-slate-600">Base rate<input className="input mt-1" type="number" min="0" value={form.baseRate} onChange={(e) => update("baseRate", Number(e.target.value))} /></label>
          <label className="text-xs font-bold text-slate-600">Adults<input className="input mt-1" type="number" min="1" value={form.adults} onChange={(e) => update("adults", Number(e.target.value))} /></label>
          <label className="text-xs font-bold text-slate-600">Children<input className="input mt-1" type="number" min="0" value={form.children} onChange={(e) => update("children", Number(e.target.value))} /></label>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 font-black text-slate-900"><CalendarRange size={18} /> Nightly breakdown</div>
          <div className="divide-y divide-slate-100">{quote.breakdown.map((night) => <div key={night.date} className="flex items-center justify-between px-5 py-4"><div><div className="font-bold text-slate-800">{night.date}</div><div className="text-xs text-slate-500">{night.appliedRules.join(", ") || "Standard rate"}</div></div><div className="font-black text-slate-950">৳{night.rate.toLocaleString()}</div></div>)}</div>
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm"><div className="flex items-center gap-2 text-sm font-black"><Calculator size={18} /> Quote summary</div><div className="mt-6 text-3xl font-black">৳{quote.netTotal.toLocaleString()}</div><div className="mt-1 text-sm text-white/60">{quote.nights} night(s) · ADR ৳{quote.averageNightlyRate.toLocaleString()}</div><div className="mt-5 border-t border-white/10 pt-4 text-xs text-white/60">Database-backed rate plans and restrictions are included in the Phase 2 migration.</div></aside>
      </div>
    </section>
  )
}
