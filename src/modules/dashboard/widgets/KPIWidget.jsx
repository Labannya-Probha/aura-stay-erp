import { ArrowRight } from "lucide-react"

const SPARKLINES = [
  [10, 14, 22, 16, 28, 24, 34, 29, 36],
  [9, 17, 12, 20, 15, 26, 24, 31, 27],
  [12, 18, 16, 24, 20, 30, 27, 35, 32],
  [11, 13, 19, 17, 23, 26, 25, 33, 31],
]

function sparklinePath(points) {
  if (!points.length) return ""
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = Math.max(max - min, 1)
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100
      const y = 100 - ((point - min) / span) * 100
      return `${index === 0 ? "M" : "L"}${x},${y}`
    })
    .join(" ")
}

export default function KPIWidget({
  title,
  value,
  subtitle = "",
  icon: Icon,
  trendValue = "",
  trendDelta = "",
  loading = false,
  onClick,
}) {
  const spark = SPARKLINES[title.length % SPARKLINES.length]

  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 w-full rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: "var(--tenant-border, rgb(var(--tenant-primary-rgb, 31 111 120) / 0.18))",
        background: "var(--tenant-surface, #fff)",
      }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" style={{ color: "var(--tenant-text-muted)" }}>
            {title}
          </p>

          <div className="mt-2 truncate text-[2rem] font-black tracking-tight" style={{ color: "var(--tenant-text)" }}>
            {loading ? "..." : value}
          </div>

          {subtitle && (
            <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4" style={{ color: "var(--tenant-text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.12)",
            color: "var(--tenant-primary, #1F6F78)",
          }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black" style={{ color: "var(--tenant-primary, #1F6F78)" }}>
        <ArrowRight size={14} />
        <span>{trendValue || "Live"}</span>
        <span>{trendDelta}</span>
      </div>

      <svg viewBox="0 0 100 26" className="mt-2 h-6 w-full" style={{ color: "var(--tenant-primary, #1F6F78)" }}>
        <path
          d={sparklinePath(spark)}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="sr-only">KPI trend sparkline</div>
      <div className="h-0.5 w-full rounded-full" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.12)" }} />
    </button>
  )
}
