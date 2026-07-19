export default function ActivityTimeline({ loading = false, data = [] }) {
  const rows = Array.isArray(data) ? data : []

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-black text-slate-950">Recent Activity</h2>
        <p className="mt-1 text-sm text-slate-500">Latest operational events across the ERP</p>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
          No recent activity
        </div>
      ) : (
        <div className="mt-6 divide-y divide-slate-100">
          {rows.map((item, index) => (
            <div key={`${item.time}-${item.title}-${index}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="w-14 shrink-0 text-xs font-black text-slate-400">
                {item.time || "--:--"}
              </div>

              <div className="relative flex-1">
                <div
                  className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--tenant-primary, #0F766E)" }}
                />
                <div className="text-sm font-bold text-slate-800">
                  {item.title || "Activity"}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-400">
                  {item.meta || "System"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
