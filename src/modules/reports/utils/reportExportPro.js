import { formatReportValue, getFieldKey, getFieldLabel } from "./reportTableUtils"

function escapeCsv(value) {
  const text = String(value ?? "")
  if (text.includes(",") || text.includes('"') || text.includes("\n")) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function exportRowsToCsv({ report, fields, rows }) {
  const csv = [
    fields.map(getFieldLabel),
    ...rows.map((row) => fields.map((field) => formatReportValue(row[getFieldKey(field)], field))),
  ].map((line) => line.map(escapeCsv).join(",")).join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${report?.slug || "report"}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportRowsToExcel({ report, fields, rows }) {
  const html = `<html><head><meta charset="utf-8" /></head><body><table><thead><tr>${fields
    .map((field) => `<th>${getFieldLabel(field)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${fields.map((field) => `<td>${formatReportValue(row[getFieldKey(field)], field)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></body></html>`

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${report?.slug || "report"}.xls`
  link.click()
  URL.revokeObjectURL(url)
}

export function printLandscapeReport() {
  window.print()
}
