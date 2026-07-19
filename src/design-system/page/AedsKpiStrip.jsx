export default function AedsKpiStrip({ items = [] }) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="aeds-kpi-card p-5">
          <p className="text-sm font-bold" style={{ color: "var(--tenant-text-muted)" }}>{item.label}</p>
          <div className="mt-2 text-3xl font-black" style={{ color: "var(--tenant-text)" }}>{item.value}</div>
          {item.meta && <p className="mt-1 text-xs font-semibold" style={{ color: "var(--tenant-primary)" }}>{item.meta}</p>}
        </div>
      ))}
    </div>
  )
}
