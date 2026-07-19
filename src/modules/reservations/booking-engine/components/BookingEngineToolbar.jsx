import {
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"

import {
  addMonths,
  monthFromInput,
  monthInputValue,
  monthLabel,
} from "../utils/dateRange"

export default function BookingEngineToolbar({
  filters,
  setFilters,
  monthCursor,
  setMonthCursor,
  roomTypes = [],
}) {
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
          onChange={(event) =>
            updateFilter(
              "search",
              event.target.value
            )
          }
          placeholder="Search guest, room, reservation, source..."
        />
      </div>

      <select
        value={filters.roomType}
        onChange={(event) =>
          updateFilter(
            "roomType",
            event.target.value
          )
        }
      >
        <option value="ALL">All room types</option>

        {roomTypes.map((roomType) => (
          <option
            key={roomType}
            value={roomType}
          >
            {roomType}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(event) =>
          updateFilter(
            "status",
            event.target.value
          )
        }
      >
        <option value="ALL">All statuses</option>
        <option value="QUERY">Query</option>
        <option value="QUOTED">Quoted</option>
        <option value="TENTATIVE">
          Tentative
        </option>
        <option value="CONFIRMED">
          Confirmed
        </option>
        <option value="CHECKED_IN">
          In-house
        </option>
        <option value="CHECKED_OUT">
          Checked out
        </option>
        <option value="SETTLED">Settled</option>
        <option value="NO_SHOW">No show</option>
        <option value="BLOCKED">Blocked</option>
      </select>

      <div className="aeds-month-control">
        <button
          type="button"
          onClick={() =>
            setMonthCursor((current) =>
              addMonths(current, -1)
            )
          }
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>

        <label>
          <span>{monthLabel(monthCursor)}</span>

          <input
            type="month"
            value={monthInputValue(monthCursor)}
            onChange={(event) =>
              setMonthCursor(
                monthFromInput(
                  event.target.value
                )
              )
            }
          />
        </label>

        <button
          type="button"
          onClick={() =>
            setMonthCursor((current) =>
              addMonths(current, 1)
            )
          }
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
