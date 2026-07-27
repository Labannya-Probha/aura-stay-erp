export default function AedsKpiStrip({ items = [] }) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="aeds-kpi-card p-4">
          <p
            className="text-xs font-semibold uppercase tracking-[0.04em]"
            style={{ color: 'var(--tenant-text-muted)' }}
          >
            {item.label}
          </p>
          <div
            className="metric-value mt-1 text-[22px] font-medium leading-tight"
            style={{ color: 'var(--tenant-text)' }}
          >
            {item.value}
          </div>
          {item.meta && (
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--tenant-primary)' }}>
              {item.meta}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
