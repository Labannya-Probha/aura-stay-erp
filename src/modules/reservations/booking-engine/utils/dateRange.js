export function startOfMonth(value = new Date()) {
  const date = new Date(value)
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  )
}

export function addMonths(value, amount) {
  const date = startOfMonth(value)

  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1
  )
}

export function buildMonthDateRange(
  monthCursor = new Date()
) {
  const first = startOfMonth(monthCursor)

  const last = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0
  )

  const days = []

  for (
    let date = new Date(first);
    date <= last;
    date.setDate(date.getDate() + 1)
  ) {
    const copy = new Date(date)
    const iso = toLocalIso(copy)
    const dow = copy.getDay()

    days.push({
      date: copy,
      iso,
      day: String(copy.getDate()).padStart(2, "0"),
      label: copy.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      month: copy.toLocaleDateString("en-US", {
        month: "short",
      }),
      isToday:
        iso === toLocalIso(new Date()),
      // Bangladesh weekend: Friday (5) & Saturday (6)
      isWeekend: dow === 5 || dow === 6,
    })
  }

  return days
}

export function monthInputValue(value) {
  const date = startOfMonth(value)

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`
}

export function monthFromInput(value) {
  const [year, month] = String(value)
    .split("-")
    .map(Number)

  if (!year || !month) return startOfMonth()

  return new Date(year, month - 1, 1)
}

export function monthLabel(value) {
  return startOfMonth(value).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  )
}

function toLocalIso(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  )
  const day = String(date.getDate()).padStart(
    2,
    "0"
  )

  return `${year}-${month}-${day}`
}
