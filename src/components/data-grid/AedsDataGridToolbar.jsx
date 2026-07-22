import { Download, FileSpreadsheet, Printer, Search } from "lucide-react"
import AedsDataGridColumnMenu from "./AedsDataGridColumnMenu"
import { Button } from "src/components/ui/button"
import { Input } from "src/components/ui/input"

function escapeCsv(value) {
  const text = String(value ?? "")
  if (text.includes(",") || text.includes('"') || text.includes("\n")) return `"${text.replace(/"/g, '""')}"`
  return text
}

function columnKey(column) {
  return column?.accessorKey || column?.id || String(column?.header || "column")
}

function exportCsv({ title, columns, rows }) {
  const exportableColumns = columns.filter((column) => column?.accessorKey)
  const csv = [exportableColumns.map((column) => column.header), ...rows.map((row) => exportableColumns.map((column) => row[column.accessorKey] ?? ""))]
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
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search table..." className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
      </div>
      <select className="aeds-grid-select rounded-xl border border-slate-200 bg-white px-2 text-sm" value={groupBy || ""} onChange={(event) => setGroupBy(event.target.value)}>
        <option value="">Group by: None</option>
        {columns.filter((column) => column?.accessorKey).map((column) => <option key={columnKey(column)} value={column.accessorKey}>{column.header}</option>)}
      </select>
      <AedsDataGridColumnMenu columns={columns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} />
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()}><Printer size={16} /> Print</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => exportCsv({ title, columns, rows })}><Download size={16} /> CSV</Button>
      <Button type="button" size="sm" onClick={() => exportCsv({ title, columns, rows })}><FileSpreadsheet size={16} /> Excel</Button>
    </div>
  )
}
