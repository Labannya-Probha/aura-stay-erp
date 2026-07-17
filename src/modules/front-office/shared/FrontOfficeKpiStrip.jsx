function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`
}

export default function FrontOfficeKpiStrip({ data = {}, loading = false }) {
  const items = [
    { label: "Arrivals", value: data.arrivals ?? 0 },
    { label: "Departures", value: data.departures ?? 0 },
    { label: "In-House", value: data.inHouse ?? 0 },
    { label: "Available Rooms", value: data.availableRooms ?? 0 },
    { label: "Dirty Rooms", value: data.dirtyRooms ?? 0 },
    { label: "Due Balance", value: money(data.dueBalance) },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">{item.label}</div>
          <div className="mt-1 text-xl font-black text-slate-950">{loading ? "..." : item.value}</div>
        </div>
      ))}
    </div>
  )
}
