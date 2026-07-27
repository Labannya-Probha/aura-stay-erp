import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

import SearchableSelect from '../../../../components/SearchableSelect.jsx'

import { addMonths, monthFromInput, monthInputValue, monthLabel } from '../utils/dateRange'

export default function BookingEngineToolbar({
  filters,
  setFilters,
  monthCursor,
  setMonthCursor,
  roomTypes = [],
}) {
  const roomTypeOptions = [
    { value: 'ALL', label: 'All room types' },
    ...roomTypes.map((roomType) => ({
      value: roomType,
      label: roomType,
    })),
  ]

  const statusOptions = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'QUERY', label: 'Query' },
    { value: 'QUOTED', label: 'Quoted' },
    { value: 'TENTATIVE', label: 'Tentative' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CHECKED_IN', label: 'In-house' },
    { value: 'CHECKED_OUT', label: 'Checked out' },
    { value: 'SETTLED', label: 'Settled' },
    { value: 'NO_SHOW', label: 'No show' },
    { value: 'BLOCKED', label: 'Blocked' },
  ]

  function updateFilter(key, value) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  return (
    <div className="aeds-booking-toolbar">
      <div className="aeds-search">
        <Search size={16} />
        <input
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          placeholder="Search guest, room, reservation, source..."
        />
      </div>

      <SearchableSelect
        value={filters.roomType}
        onChange={(value) => updateFilter('roomType', value)}
        options={roomTypeOptions}
        placeholder="All room types"
        searchPlaceholder="Search room type..."
        className="min-w-[220px]"
      />

      <SearchableSelect
        value={filters.status}
        onChange={(value) => updateFilter('status', value)}
        options={statusOptions}
        placeholder="All statuses"
        searchPlaceholder="Search status..."
        className="min-w-[200px]"
      />

      <div className="aeds-month-control">
        <button
          type="button"
          onClick={() => setMonthCursor((current) => addMonths(current, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>

        <label>
          <span>{monthLabel(monthCursor)}</span>

          <input
            type="month"
            value={monthInputValue(monthCursor)}
            onChange={(event) => setMonthCursor(monthFromInput(event.target.value))}
          />
        </label>

        <button
          type="button"
          onClick={() => setMonthCursor((current) => addMonths(current, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
