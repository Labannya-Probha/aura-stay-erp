import { PlaneTakeoff, PlaneLanding } from "lucide-react"

export default function ArrivalsDeparturesWidget({ loading = false, summary = {} }) {
  const arrivals = Number(summary.arrivals || 0)
  const departures = Number(summary.departures || 0)

  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        borderColor: "var(--tenant-border, rgb(var(--tenant-primary-rgb, 31 111 120) / 0.18))",
        background: "var(--tenant-surface, #fff)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>Today's Arrivals & Departures</h2>
        <button type="button" className="text-xs font-black" style={{ color: "var(--tenant-primary, #1F6F78)" }}>View All</button>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          <div className="h-14 animate-pulse rounded-xl" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.08)" }} />
          <div className="h-14 animate-pulse rounded-xl" style={{ background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.08)" }} />
        </div>
      ) : (
        <div className="grid gap-2.5">
          <div className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.12)", background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.06)" }}>
            <span className="inline-flex items-center gap-2 text-xs font-black" style={{ color: "var(--tenant-text-muted, #64748B)" }}><PlaneTakeoff size={14} style={{ color: "var(--tenant-primary, #1F6F78)" }} /> Arrivals</span>
            <span className="text-xl font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>{arrivals}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.12)", background: "rgb(var(--tenant-primary-rgb, 31 111 120) / 0.06)" }}>
            <span className="inline-flex items-center gap-2 text-xs font-black" style={{ color: "var(--tenant-text-muted, #64748B)" }}><PlaneLanding size={14} style={{ color: "var(--tenant-primary, #1F6F78)" }} /> Departures</span>
            <span className="text-xl font-black" style={{ color: "var(--tenant-text, #0F172A)" }}>{departures}</span>
          </div>
        </div>
      )}
    </div>
  )
}
