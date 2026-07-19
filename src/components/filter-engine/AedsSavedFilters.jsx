export default function AedsSavedFilters({ recent = [], onLoad }) {
  if (!recent.length) return null

  return (
    <div className="aeds-saved-filters">
      {recent.map((item) => (
        <button
          key={`${item.name}-${item.savedAt}`}
          type="button"
          className="aeds-saved-filter-item"
          onClick={() => onLoad(item.values)}
        >
          {item.name}
          <small>{new Date(item.savedAt).toLocaleString()}</small>
        </button>
      ))}
    </div>
  )
}
