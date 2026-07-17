export default function AedsFilterChips({ values = {}, clear, reset }) {
  const entries = Object.entries(values).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== "" && value !== null && value !== undefined
  })

  if (!entries.length) return null

  return (
    <div className="aeds-filter-chips">
      {entries.map(([key, value]) => (
        <span key={key} className="aeds-filter-chip">
          <strong>{key.replace(/_/g, " ")}</strong>
          <span>{Array.isArray(value) ? value.join(", ") : String(value)}</span>
          <button type="button" onClick={() => clear(key)}>×</button>
        </span>
      ))}

      <button type="button" className="aeds-filter-chip" onClick={reset}>
        Clear All
      </button>
    </div>
  )
}
