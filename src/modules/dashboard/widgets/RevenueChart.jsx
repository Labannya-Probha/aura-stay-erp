function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`
}

function linePath(points, maxValue) {
  if (!points.length) return ""
  const safeMax = Math.max(maxValue, 1)
  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100
      const y = 100 - (Number(value || 0) / safeMax) * 100
      return `${index === 0 ? "M" : "L"}${x},${y}`
    })
    .join(" ")
}

export default function RevenueChart({ loading = false, data = [], summary = {} }) {
  const rows = Array.isArray(data) ? data : []
  const roomSeries = rows.map((d) => Number(d.room || 0))
  const posSeries = rows.map((d) => Number(d.pos || 0))
  const otherSeries = rows.map((d) => Number(d.other || 0))
  const totalSeries = rows.map((_, i) => roomSeries[i] + posSeries[i] + otherSeries[i])
  const max = Math.max(...totalSeries, 0)
  const totalRevenue = Number(summary.roomRevenue || 0) + Number(summary.restaurantRevenue || 0)

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
          <h2 className="text-base font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>Revenue Overview</h2>
          <div className="mt-1 text-[2rem] font-black tracking-tight" style={{ color: "var(--tenant-text, #0F172A)" }}>
            {money(totalRevenue)}
          </div>
          <p className="mt-0.5 text-xs font-bold" style={{ color: "var(--tenant-primary, #1F6F78)" }}>↗ +14.6% vs last month</p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.08)",
            color: "var(--tenant-text-muted, #64748B)",
          }}
        >
          This Month
        </span>
      </div>

      {loading ? (
        <div className="mt-4 h-40 animate-pulse rounded-xl" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.08)" }} />
      ) : rows.length === 0 ? (
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl text-xs font-semibold" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.06)", color: "var(--tenant-text-muted, #64748B)" }}>
          No revenue data found
        </div>
      ) : (
        <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.12)" }}>
          <svg viewBox="0 0 100 44" className="h-28 w-full">
            <path d={linePath(totalSeries, max)} fill="none" stroke="var(--tenant-primary, #1F6F78)" strokeWidth="2.1" strokeLinecap="round" />
            <path d={linePath(roomSeries, max)} fill="none" stroke="var(--tenant-accent, #2E7D32)" strokeWidth="1.9" strokeLinecap="round" />
            <path d={linePath(posSeries, max)} fill="none" stroke="rgb(var(--tenant-primary-rgb, 31 111 120) / 0.45)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-bold" style={{ color: "var(--tenant-text-muted, #64748B)" }}>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--tenant-primary, #1F6F78)" }} /> Room Revenue</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--tenant-accent, #2E7D32)" }} /> Restaurant Revenue</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.45)" }} /> Other Revenue</span>
          </div>
        </div>
      )}
    </div>
  )
}
