function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`
}

export default function RestaurantWidget({ loading = false, data = {} }) {
  const stats = [
    { label: "Sales", value: money(data.sales) },
    { label: "Orders", value: data.orders ?? 0 },
    { label: "Open KOT", value: data.openKot ?? 0 },
    { label: "Avg Bill", value: money(data.averageBill) },
  ]

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Restaurant POS</h2>
      <p className="mt-1 text-sm text-slate-500">Today’s restaurant performance</p>

      {loading ? (
        <div className="mt-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {stats.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-bold text-slate-500">{item.label}</span>
              <span className="text-sm font-black text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
        Top item: {data.topItem || "-"}
      </div>
    </div>
  )
}
