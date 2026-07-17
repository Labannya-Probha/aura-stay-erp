import { formatReportCell } from "./reportFormatters"

function escapeCsv(value) {
  const text = String(value ?? "")
  return text.includes(",") || text.includes('"') ? `"${text.replace(/"/g, '""')}"` : text
}

export function exportReportExcel(report, fields, rows) {
  const csv = [
    fields.map((field) => field.label),
    ...rows.map((row) => fields.map((field) => formatReportCell(row[field.fieldKey], field.dataType, field.displayFormat))),
  ].map((row) => row.map(escapeCsv).join(",")).join("\n")

  const blob = new Blob([csv], { type: "application/vnd.ms-excel;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${report?.reportCode || "report"}-${report?.slug || "export"}.xls`
  link.click()
  URL.revokeObjectURL(url)
}

export function printReport() {
  window.print()
}
