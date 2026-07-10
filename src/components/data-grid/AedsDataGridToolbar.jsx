import { Download, FileSpreadsheet, Printer, Search } from "lucide-react"
import AedsDataGridColumnMenu from "./AedsDataGridColumnMenu"

function escapeCsv(value) {
  const text = String(value ?? "")
  if (text.includes(",") || text.includes('"') || text.includes("\n")) return `"${text.replace(/"/g, '""')}"`
  return text
}

function exportCsv({ title, columns, rows }) {
  const csv = [columns.map((column) => column.header), ...rows.map((row) => columns.map((column) => row[column.accessorKey] ?? ""))]
    .map((line) => line.map(escapeCsv).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${title || "aeds-grid"}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function AedsDataGridToolbar({ title, columns, rows, search, setSearch, groupBy, setGroupBy, columnVisibility, setColumnVisibility }) {
  return (
    <div className="aeds-grid-toolbar">
      <div className="aeds-grid-search">
        <Search size={16} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search table..." />
      </div>
      <select className="aeds-grid-select" value={groupBy || ""} onChange={(event) => setGroupBy(event.target.value)}>
        <option value="">Group by: None</option>
        {columns.map((column) => <option key={column.accessorKey} value={column.accessorKey}>{column.header}</option>)}
      </select>
      <AedsDataGridColumnMenu columns={columns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} />
      <button type="button" className="aeds-grid-btn" onClick={() => window.print()}><Printer size={16} /> Print</button>
      <button type="button" className="aeds-grid-btn" onClick={() => exportCsv({ title, columns, rows })}><Download size={16} /> CSV</button>
      <button type="button" className="aeds-grid-btn primary" onClick={() => exportCsv({ title, columns, rows })}><FileSpreadsheet size={16} /> Excel</button>
    </div>
  )
}
