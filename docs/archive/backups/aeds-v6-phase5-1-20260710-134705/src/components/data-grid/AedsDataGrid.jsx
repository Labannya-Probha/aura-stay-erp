import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react"
import AedsDataGridToolbar from "./AedsDataGridToolbar"
import AedsDataGridPagination from "./AedsDataGridPagination"
import "./aeds-data-grid.css"

function formatValue(value, column) {
  if (value === null || value === undefined || value === "") return "—"
  if (column.type === "currency") return `৳${Number(value || 0).toLocaleString("en-BD")}`
  if (column.type === "percent") return `${Number(value || 0).toFixed(2)}%`
  if (column.type === "date") {
    const date = new Date(`${value}T00:00:00`)
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  }
  return String(value)
}
function alignment(column) { return column.align || (["currency", "number", "percent"].includes(column.type) ? "right" : "left") }
function statusTone(value) {
  const text = String(value || "").toLowerCase()
  if (/void|cancel|failed|overdue|dirty|out/.test(text)) return "danger"
  if (/pending|draft|hold|inspection/.test(text)) return "warning"
  if (/posted|paid|settled|received|clean|confirmed/.test(text)) return "success"
  return ""
}
function isTotalColumn(column) { return column.aggregation === "sum" || ["currency", "number"].includes(column.type) }
function calculateTotals(columns, rows) {
  return columns.reduce((acc, column) => {
    if (isTotalColumn(column)) acc[column.accessorKey] = rows.reduce((sum, row) => sum + Number(row[column.accessorKey] || 0), 0)
    return acc
  }, {})
}
function filterRows(rows, columns, search) {
  const q = String(search || "").trim().toLowerCase()
  if (!q) return rows
  const keys = columns.map((column) => column.accessorKey)
  return rows.filter((row) => keys.some((key) => String(row[key] ?? "").toLowerCase().includes(q)))
}
function sortRows(rows, sort) {
  if (!sort?.key) return rows
  const dir = sort.direction === "desc" ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key]
    if (av === bv) return 0
    if (!Number.isNaN(Number(av)) && !Number.isNaN(Number(bv))) return (Number(av) - Number(bv)) * dir
    return String(av ?? "").localeCompare(String(bv ?? "")) * dir
  })
}
function groupRows(rows, key) {
  if (!key) return null
  return rows.reduce((acc, row) => {
    const value = row[key] || "Unassigned"
    if (!acc[value]) acc[value] = []
    acc[value].push(row)
    return acc
  }, {})
}
export default function AedsDataGrid({ title = "Enterprise DataGrid", subtitle = "AEDS v5 reusable table engine", data = [], columns = [], pageSize = 300, frozenFirstColumn = true }) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState(null)
  const [groupBy, setGroupBy] = useState("")
  const [page, setPage] = useState(0)
  const [columnWidths, setColumnWidths] = useState({})
  const [columnOrder, setColumnOrder] = useState(columns.map((column) => column.accessorKey))
  const [columnVisibility, setColumnVisibility] = useState({})
  const visibleColumns = useMemo(() => {
    const byKey = new Map(columns.map((column) => [column.accessorKey, column]))
    return columnOrder.map((key) => byKey.get(key)).filter(Boolean).concat(columns.filter((column) => !columnOrder.includes(column.accessorKey))).filter((column) => columnVisibility[column.accessorKey] !== false)
  }, [columns, columnOrder, columnVisibility])
  const processedRows = useMemo(() => sortRows(filterRows(data, columns, search), sort), [data, columns, search, sort])
  const pagedRows = useMemo(() => processedRows.slice(page * pageSize, page * pageSize + pageSize), [processedRows, page, pageSize])
  const totals = useMemo(() => calculateTotals(visibleColumns, processedRows), [visibleColumns, processedRows])
  const grouped = useMemo(() => groupRows(pagedRows, groupBy), [pagedRows, groupBy])
  const onSort = (column) => setSort((current) => current?.key !== column.accessorKey ? { key: column.accessorKey, direction: "asc" } : current.direction === "asc" ? { key: column.accessorKey, direction: "desc" } : null)
  const moveColumn = (key, direction) => setColumnOrder((current) => { const next = [...current]; const index = next.indexOf(key); const target = direction === "left" ? index - 1 : index + 1; if (index < 0 || target < 0 || target >= next.length) return current; const [item] = next.splice(index, 1); next.splice(target, 0, item); return next })
  const resizeColumn = (key, delta) => setColumnWidths((current) => ({ ...current, [key]: Math.max(100, Number(current[key] || 170) + delta) }))
  const renderSortIcon = (column) => sort?.key !== column.accessorKey ? null : sort.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  const renderRow = (row, rowIndex) => <tr key={row.id || rowIndex} className="aeds-grid-row">{visibleColumns.map((column, columnIndex) => { const frozen = frozenFirstColumn && columnIndex === 0; const value = row[column.accessorKey]; const tone = column.type === "status" ? statusTone(value) : ""; return <td key={column.accessorKey} className={`aeds-grid-cell aeds-grid-align-${alignment(column)} ${frozen ? "aeds-grid-frozen" : ""}`} style={{ width: columnWidths[column.accessorKey] || column.width || 170 }}>{column.type === "status" ? <span className={`aeds-grid-status ${tone}`}>{formatValue(value, column)}</span> : formatValue(value, column)}</td> })}</tr>
  return <section className="aeds-grid-card"><header className="aeds-grid-header"><div><h2>{title}</h2><p>{subtitle} · {processedRows.length.toLocaleString("en-BD")} row(s)</p></div></header><AedsDataGridToolbar title={title} columns={columns} rows={processedRows} search={search} setSearch={setSearch} groupBy={groupBy} setGroupBy={setGroupBy} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}/><div className="aeds-grid-wrap"><table className="aeds-grid-table"><thead><tr>{visibleColumns.map((column, columnIndex) => { const frozen = frozenFirstColumn && columnIndex === 0; return <th key={column.accessorKey} className={`aeds-grid-align-${alignment(column)} ${frozen ? "aeds-grid-frozen" : ""}`} style={{ width: columnWidths[column.accessorKey] || column.width || 170 }}><div className="aeds-grid-th-inner"><button type="button" className="aeds-grid-th-title" onClick={() => onSort(column)}><GripVertical size={12}/><span>{column.header}</span>{renderSortIcon(column)}</button><button type="button" className="aeds-grid-mini" onClick={() => moveColumn(column.accessorKey, "left")}>‹</button><button type="button" className="aeds-grid-mini" onClick={() => moveColumn(column.accessorKey, "right")}>›</button><span className="aeds-grid-resizer" role="separator" onClick={() => resizeColumn(column.accessorKey, 32)} onDoubleClick={() => setColumnWidths((current) => ({ ...current, [column.accessorKey]: 170 }))}/></div></th> })}</tr></thead><tbody>{grouped ? Object.entries(grouped).map(([groupValue, groupRowsList]) => { const groupTotals = calculateTotals(visibleColumns, groupRowsList); return <><tr className="aeds-grid-group-row" key={`group-${groupValue}`}><td colSpan={visibleColumns.length}>{columns.find((column) => column.accessorKey === groupBy)?.header}: <strong>{groupValue}</strong> · {groupRowsList.length} row(s)</td></tr>{groupRowsList.map(renderRow)}<tr className="aeds-grid-subtotal" key={`subtotal-${groupValue}`}>{visibleColumns.map((column, index) => <td key={column.accessorKey} className={`aeds-grid-align-${alignment(column)}`}>{index === 0 ? "Sub Total" : groupTotals[column.accessorKey] !== undefined ? formatValue(groupTotals[column.accessorKey], column) : ""}</td>)}</tr></> }) : pagedRows.map(renderRow)}{!pagedRows.length && <tr><td colSpan={visibleColumns.length} className="aeds-grid-empty">No data found.</td></tr>}</tbody><tfoot><tr className="aeds-grid-total">{visibleColumns.map((column, index) => <td key={column.accessorKey} className={`aeds-grid-align-${alignment(column)}`}>{index === 0 ? "Grand Total" : totals[column.accessorKey] !== undefined ? formatValue(totals[column.accessorKey], column) : ""}</td>)}</tr></tfoot></table></div><AedsDataGridPagination page={page} pageSize={pageSize} totalRows={processedRows.length} setPage={setPage}/></section>
}
