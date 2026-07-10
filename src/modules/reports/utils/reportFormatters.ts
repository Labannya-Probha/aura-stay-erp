export function formatReportCell(value, dataType, displayFormat) {
  if (value === null || value === undefined || value === "") return "-"
  if (dataType?.includes("Currency")) return `৳${Number(value || 0).toLocaleString("en-BD")}`
  if (dataType === "Date") {
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  }
  if (dataType === "Percent") return `${Number(value || 0).toFixed(1)}%`
  return String(value)
}
