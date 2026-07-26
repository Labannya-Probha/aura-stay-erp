import { Search } from "lucide-react"

const VIEW_OPTIONS = [
  { id: "7D", label: "7 days" },
  { id: "14D", label: "14 days" },
  { id: "30D", label: "30 days" },
]

export default function BookingEngineToolbar({
  filters,
  setFilters,
  viewMode,
  setViewMode,
}) {
  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="aeds-booking-toolbar">
      <div className="aeds-search">
        <Search size={16} />
        <input
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          placeholder="Search guest, room, confirmation..."
        />
      </div>

      <select value={filters.roomType} onChange={(e) => updateFilter("roomType", e.target.value)}>
        <option value="ALL">All room types</option>
        <option value="DELUXE">Deluxe</option>
        <option value="SUITE">Suite</option>
        <option value="VILLA">Villa</option>
      </select>

      <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
        <option value="ALL">All status</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="CHECKED_IN">In-house</option>
        <option value="TENTATIVE">Tentative</option>
        <option value="BLOCKED">Blocked</option>
      </select>

      <div className="aeds-view-switcher">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setViewMode(option.id)}
            className={viewMode === option.id ? "active" : ""}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
