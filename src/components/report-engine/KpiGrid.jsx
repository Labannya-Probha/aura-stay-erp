const METRIC_LABELS = {
  occupancy_rate: { label: 'Occupancy Rate', format: 'percent' },
  adr: { label: 'ADR (Average Daily Rate)', format: 'currency' },
  revpar: { label: 'RevPAR', format: 'currency' },
  room_revenue: { label: 'Room Revenue', format: 'currency' },
  gop: { label: 'GOP (Gross Operating Profit)', format: 'currency' },
  ebitda: { label: 'EBITDA', format: 'currency' },
  net_profit: { label: 'Net Profit', format: 'currency' },
  net_profit_margin_pct: { label: 'Net Profit Margin', format: 'percent' },
  current_ratio: { label: 'Current Ratio', format: 'ratio' },
  quick_ratio: { label: 'Quick Ratio', format: 'ratio' },
  working_capital: { label: 'Working Capital', format: 'currency' },
}

function formatValue(value, format) {
  const n = Number(value || 0)
  if (format === 'percent') return `${n.toFixed(2)}%`
  if (format === 'ratio') return n.toFixed(2)
  return `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function KpiGrid({ title, description, rows = [], summary = {} }) {
  return (
    <section className="kpi-grid">
      <header className="kpi-grid__header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {summary.start_date && summary.end_date ? (
          <p className="kpi-grid__period">
            For the period {summary.start_date} to {summary.end_date}
          </p>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <div className="kpi-grid__empty">No activity data available for this period yet.</div>
      ) : (
        <div className="kpi-grid__cards">
          {rows.map((row) => {
            const meta = METRIC_LABELS[row.metric] || { label: row.metric, format: 'currency' }
            return (
              <div className="kpi-card" key={row.metric}>
                <p className="kpi-card__label">{meta.label}</p>
                <p className="kpi-card__value">{formatValue(row.value, meta.format)}</p>
              </div>
            )
          })}
        </div>
      )}

      {summary.active_rooms ? (
        <p className="kpi-grid__footnote">
          Based on {summary.active_rooms} active room(s), {summary.available_room_nights} available
          room-night(s), {summary.occupied_room_nights} occupied room-night(s).
        </p>
      ) : null}
    </section>
  )
}
