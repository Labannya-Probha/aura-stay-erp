export default function OccupancyChart({ loading = false, summary = {}, housekeeping = {} }) {
  const occupied = Number(summary.inHouseGuests || 0)
  const vacant = Number(summary.availableRooms || 0)
  const dirty = Number(housekeeping.dirty || summary.dirtyRooms || 0)
  const outOfOrder = Number(housekeeping.outOfOrder || 0)
  const outOfService = Number(housekeeping.inspection || 0)
  const total = Math.max(occupied + vacant + dirty + outOfOrder + outOfService, 1)

  const segments = [
    { label: "Occupied", value: occupied, color: "#3B8F2A" },
    { label: "Vacant", value: vacant, color: "#9CD864" },
    { label: "Dirty", value: dirty, color: "#F5A524" },
    { label: "Out of Order", value: outOfOrder, color: "#F56E3A" },
    { label: "Out of Service", value: outOfService, color: "#C4C4C4" },
  ]

  let cursor = 0
  const conicParts = segments.map((item) => {
    const slice = (item.value / total) * 360
    const start = cursor
    cursor += slice
    return `${item.color} ${start}deg ${cursor}deg`
  })

  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        borderColor: "var(--tenant-border, rgb(var(--tenant-primary-rgb, 31 111 120) / 0.18))",
        background: "var(--tenant-surface, #fff)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>Room Status</h2>
          <p className="mt-0.5 text-sm" style={{ color: "var(--tenant-text-muted, #64748B)" }}>Current room availability mix</p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.08)",
            color: "var(--tenant-text-muted, #64748B)",
          }}
        >
          All Room Types
        </span>
      </div>

      {loading ? (
        <div className="mt-4 h-44 animate-pulse rounded-xl" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.08)" }} />
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="mx-auto grid w-full max-w-[180px] place-items-center">
            <div
              className="relative h-28 w-28 rounded-full"
              style={{ background: `conic-gradient(${conicParts.join(",")})` }}
            >
              <div className="absolute inset-[12px] grid place-items-center rounded-full bg-white text-center">
                <div className="text-2xl font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>{total}</div>
                <div className="text-[11px] font-bold" style={{ color: "var(--tenant-text-muted, #64748B)" }}>Total Rooms</div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            {segments.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[11px] font-bold" style={{ color: "var(--tenant-text-muted, #64748B)" }}>
                <span className="inline-flex items-center gap-2">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  {item.label}
                </span>
                <span>{item.value} ({((item.value / total) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
