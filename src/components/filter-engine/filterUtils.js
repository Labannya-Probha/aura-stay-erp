export const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_quarter", label: "This Quarter" },
  { key: "this_half_year", label: "Half Year" },
  { key: "this_year", label: "This Year" },
  { key: "custom", label: "Custom Range" },
]

function iso(date) {
  return date.toISOString().slice(0, 10)
}

function startOfWeek(date) {
  const next = new Date(date)
  const day = next.getDay() || 7
  next.setDate(next.getDate() - day + 1)
  return next
}

function endOfWeek(date) {
  const next = startOfWeek(date)
  next.setDate(next.getDate() + 6)
  return next
}

function startOfQuarter(date) {
  const month = Math.floor(date.getMonth() / 3) * 3
  return new Date(date.getFullYear(), month, 1)
}

function endOfQuarter(date) {
  const start = startOfQuarter(date)
  return new Date(start.getFullYear(), start.getMonth() + 3, 0)
}

export function resolveDatePreset(preset) {
  const now = new Date()

  if (preset === "today") return { startDate: iso(now), endDate: iso(now) }

  if (preset === "yesterday") {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    return { startDate: iso(y), endDate: iso(y) }
  }

  if (preset === "this_week") {
    return { startDate: iso(startOfWeek(now)), endDate: iso(endOfWeek(now)) }
  }

  if (preset === "last_week") {
    const ref = new Date(now)
    ref.setDate(ref.getDate() - 7)
    return { startDate: iso(startOfWeek(ref)), endDate: iso(endOfWeek(ref)) }
  }

  if (preset === "this_month") {
    return {
      startDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  }

  if (preset === "last_month") {
    return {
      startDate: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      endDate: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
    }
  }

  if (preset === "this_quarter") {
    return { startDate: iso(startOfQuarter(now)), endDate: iso(endOfQuarter(now)) }
  }

  if (preset === "this_half_year") {
    const startMonth = now.getMonth() < 6 ? 0 : 6
    return {
      startDate: iso(new Date(now.getFullYear(), startMonth, 1)),
      endDate: iso(new Date(now.getFullYear(), startMonth + 6, 0)),
    }
  }

  if (preset === "this_year") {
    return {
      startDate: iso(new Date(now.getFullYear(), 0, 1)),
      endDate: iso(new Date(now.getFullYear(), 11, 31)),
    }
  }

  return {}
}

export function removeEmptyFilters(values) {
  return Object.fromEntries(
    Object.entries(values || {}).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== "" && value !== null && value !== undefined
    })
  )
}

export function buildFilterQuery(values) {
  const clean = removeEmptyFilters(values)
  return new URLSearchParams(
    Object.entries(clean).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(",") : String(value),
    ])
  ).toString()
}

export function readFilterQuery(search) {
  const params = new URLSearchParams(search)
  const values = {}
  params.forEach((value, key) => {
    values[key] = value.includes(",") ? value.split(",") : value
  })
  return values
}
