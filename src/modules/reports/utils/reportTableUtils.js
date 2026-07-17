export function getFieldKey(field) {
  return field.fieldKey || field.field_key || field.accessor || field.key
}

export function getFieldLabel(field) {
  return field.label || field.fieldLabel || field.field_label || field.header || getFieldKey(field)
}

export function getAlignment(field) {
  const type = String(field.dataType || field.data_type || "").toLowerCase()
  if (field.alignment) return field.alignment
  if (type.includes("currency") || type.includes("number") || type.includes("percent")) return "right"
  return "left"
}

export function formatReportValue(value, field = {}) {
  if (value === null || value === undefined || value === "") return "—"
  const type = String(field.dataType || field.data_type || "").toLowerCase()

  if (type.includes("currency")) return `৳${Number(value || 0).toLocaleString("en-BD")}`
  if (type.includes("percent")) return `${Number(value || 0).toFixed(2)}%`

  if (type === "date") {
    const date = new Date(`${value}T00:00:00`)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    }
  }

  return String(value)
}

export function isSummable(field) {
  const type = String(field.dataType || field.data_type || "").toLowerCase()
  return String(field.aggregation || "").toUpperCase() === "SUM" || type.includes("currency") || type.includes("number")
}

export function calculateTotals(fields, rows) {
  return fields.reduce((acc, field) => {
    const key = getFieldKey(field)
    if (isSummable(field)) acc[key] = rows.reduce((sum, row) => sum + Number(row[key] || 0), 0)
    return acc
  }, {})
}

export function filterRows(rows, searchTerm, fields) {
  const q = String(searchTerm || "").trim().toLowerCase()
  if (!q) return rows
  const keys = fields.map(getFieldKey).filter(Boolean)
  return rows.filter((row) => keys.some((key) => String(row[key] ?? "").toLowerCase().includes(q)))
}

export function sortRows(rows, sortState) {
  if (!sortState?.key) return rows
  const direction = sortState.direction === "desc" ? -1 : 1

  return [...rows].sort((a, b) => {
    const av = a[sortState.key]
    const bv = b[sortState.key]
    if (av === bv) return 0
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    if (!Number.isNaN(Number(av)) && !Number.isNaN(Number(bv))) return (Number(av) - Number(bv)) * direction
    return String(av).localeCompare(String(bv)) * direction
  })
}

export function groupRows(rows, groupKey) {
  if (!groupKey) return null
  return rows.reduce((acc, row) => {
    const groupValue = row[groupKey] || "Unassigned"
    if (!acc[groupValue]) acc[groupValue] = []
    acc[groupValue].push(row)
    return acc
  }, {})
}

export function getCellTone(value, field) {
  const key = String(getFieldKey(field) || "").toLowerCase()
  const text = String(value || "").toLowerCase()
  const number = Number(value || 0)

  if (key.includes("status")) {
    if (/void|cancel|failed|overdue|dirty|out/.test(text)) return "danger"
    if (/pending|draft|hold|inspection/.test(text)) return "warning"
    if (/posted|paid|settled|received|clean|confirmed/.test(text)) return "success"
  }

  if (key.includes("balance") && number < 0) return "danger"
  if (key.includes("due") && number > 0) return "warning"
  return "default"
}
