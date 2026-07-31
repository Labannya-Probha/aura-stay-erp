function money(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD')}`
}

export default function FrontOfficeKpiStrip({ data = {}, loading = false }) {
  const items = [
    { label: 'Arrivals', value: data.arrivals ?? 0 },
    { label: 'Departures', value: data.departures ?? 0 },
    { label: 'In-House', value: data.inHouse ?? 0 },
    { label: 'Available Rooms', value: data.availableRooms ?? 0 },
    { label: 'Dirty Rooms', value: data.dirtyRooms ?? 0 },
    { label: 'Due Balance', value: money(data.dueBalance) },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[20px] border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {item.label}
          </div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            {loading ? '...' : item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
