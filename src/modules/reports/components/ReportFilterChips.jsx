export default function ReportFilterChips({ filters = {} }) {
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "")

  if (!entries.length) return null

  return (
    <div className="aeds-report-filter-chips">
      {entries.map(([key, value]) => (
        <span key={key} className="aeds-report-chip">
          <span>{key.replace(/_/g, " ")}</span>
          <strong>{String(value)}</strong>
        </span>
      ))}
    </div>
  )
}
