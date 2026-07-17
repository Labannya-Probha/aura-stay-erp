const VIEW_DAYS = {
  "7D": 7,
  "14D": 14,
  "30D": 30,
}

export function buildDateRange(viewMode = "14D") {
  const count = VIEW_DAYS[viewMode] || 14
  const today = new Date()
  const days = []

  for (let i = 0; i < count; i += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    days.push({
      date,
      iso: date.toISOString().slice(0, 10),
      day: String(date.getDate()).padStart(2, "0"),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
    })
  }

  return days
}
