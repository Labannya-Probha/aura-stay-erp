export default function TasksWidget({ loading = false, data = [] }) {
  const rows = Array.isArray(data) ? data : []

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Operational Tasks</h2>
      <p className="mt-1 text-sm text-slate-500">Items requiring attention</p>

      {loading ? (
        <div className="mt-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">
          No pending tasks
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((task, index) => (
            <button
              key={`${task.label}-${index}`}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
            >
              <span className="text-sm font-bold text-slate-600">{task.label}</span>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-black text-white"
                style={{ background: "var(--tenant-primary, #0F766E)" }}
              >
                {task.value ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
