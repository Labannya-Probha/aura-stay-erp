export default function HousekeepingWidget({ loading = false, data = {} }) {
  const rooms = [
    { label: "Clean", value: data.clean ?? 0, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Dirty", value: data.dirty ?? 0, tone: "bg-red-50 text-red-700" },
    { label: "Inspection", value: data.inspection ?? 0, tone: "bg-amber-50 text-amber-700" },
    { label: "OOO", value: data.outOfOrder ?? 0, tone: "bg-slate-100 text-slate-700" },
  ]

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Housekeeping</h2>
      <p className="mt-1 text-sm text-slate-500">Live room readiness status</p>

      {loading ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {rooms.map((item) => (
            <div key={item.label} className={`rounded-2xl p-4 ${item.tone}`}>
              <div className="text-2xl font-black">{item.value}</div>
              <div className="mt-1 text-xs font-bold">{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
