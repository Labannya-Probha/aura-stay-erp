import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, GripVertical, Loader2 } from "lucide-react"

import ReportFilterChips from "./ReportFilterChips"
import ReportTableToolbar from "./ReportTableToolbar"
import {
  calculateTotals,
  filterRows,
  formatReportValue,
  getAlignment,
  getCellTone,
  getFieldKey,
  getFieldLabel,
  groupRows,
  sortRows,
} from "../utils/reportTableUtils"

const INITIAL_RENDER_LIMIT = 300

export default function EnterpriseReportTable({
  title,
  report,
  fields = [],
  rows = [],
  loading = false,
  filters = {},
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortState, setSortState] = useState(null)
  const [groupKey, setGroupKey] = useState("")
  const [renderLimit, setRenderLimit] = useState(INITIAL_RENDER_LIMIT)
  const [columnWidths, setColumnWidths] = useState({})
  const [columnOrder, setColumnOrder] = useState([])
  const [visibleKeys, setVisibleKeys] = useState([])

  useEffect(() => {
    const keys = fields.map(getFieldKey).filter(Boolean)
    setColumnOrder((current) => current.length ? current : keys)
    setVisibleKeys((current) => current.length ? current : keys)
  }, [fields])

  const normalizedFields = useMemo(() => {
    const byKey = new Map(fields.map((field) => [getFieldKey(field), field]))
    const ordered = columnOrder.map((key) => byKey.get(key)).filter(Boolean)
    const missing = fields.filter((field) => !columnOrder.includes(getFieldKey(field)))
    return [...ordered, ...missing].filter((field) => visibleKeys.includes(getFieldKey(field)))
  }, [fields, columnOrder, visibleKeys])

  const filteredRows = useMemo(() => {
    const searched = filterRows(rows, searchTerm, fields)
    return sortRows(searched, sortState)
  }, [rows, searchTerm, fields, sortState])

  const renderedRows = useMemo(() => filteredRows.slice(0, renderLimit), [filteredRows, renderLimit])
  const totals = useMemo(() => calculateTotals(normalizedFields, filteredRows), [normalizedFields, filteredRows])
  const groupedRows = useMemo(() => groupRows(renderedRows, groupKey), [renderedRows, groupKey])

  const onSort = (field) => {
    const key = getFieldKey(field)
    if (!field.sortable && field.sortable !== undefined) return

    setSortState((current) => {
      if (current?.key !== key) return { key, direction: "asc" }
      if (current.direction === "asc") return { key, direction: "desc" }
      return null
    })
  }

  const moveColumn = (key, direction) => {
    setColumnOrder((current) => {
      const next = [...current]
      const index = next.indexOf(key)
      const target = direction === "left" ? index - 1 : index + 1
      if (index < 0 || target < 0 || target >= next.length) return current
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const onResize = (key, delta) => {
    setColumnWidths((current) => ({
      ...current,
      [key]: Math.max(100, Number(current[key] || 160) + delta),
    }))
  }

  const renderSortIcon = (field) => {
    const key = getFieldKey(field)
    if (sortState?.key !== key) return null
    return sortState.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  const renderRow = (row, rowIndex) => (
    <tr key={`${rowIndex}-${row.reference_no || ""}`} className="aeds-report-row">
      {normalizedFields.map((field, colIndex) => {
        const key = getFieldKey(field)
        const value = row[key]
        const tone = getCellTone(value, field)

        return (
          <td
            key={key}
            className={`aeds-report-cell aeds-align-${getAlignment(field)} ${colIndex === 0 ? "aeds-frozen-cell" : ""}`}
            style={{ width: columnWidths[key] || field.width || 160 }}
          >
            <span className={`aeds-cell-value tone-${tone}`}>
              {formatReportValue(value, field)}
            </span>
          </td>
        )
      })}
    </tr>
  )

  if (loading) {
    return (
      <div className="aeds-report-loading">
        <Loader2 className="animate-spin" size={20} />
        Loading enterprise report table...
      </div>
    )
  }

  return (
    <section className="aeds-report-engine">
      <div className="aeds-report-engine-header">
        <div>
          <p className="aeds-report-eyebrow">AEDS v4 Report Engine</p>
          <h2>{title || report?.title || "Report Table"}</h2>
          <p>
            {filteredRows.length.toLocaleString("en-BD")} row(s)
            {filteredRows.length > renderedRows.length ? ` · showing ${renderedRows.length.toLocaleString("en-BD")}` : ""}
          </p>
        </div>
      </div>

      <ReportFilterChips filters={filters} />

      <ReportTableToolbar
        report={report}
        fields={fields}
        rows={filteredRows}
        visibleKeys={visibleKeys}
        setVisibleKeys={setVisibleKeys}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        groupKey={groupKey}
        setGroupKey={setGroupKey}
      />

      <div className="aeds-report-table-wrap">
        <table className="aeds-report-table">
          <thead>
            <tr>
              {normalizedFields.map((field, index) => {
                const key = getFieldKey(field)

                return (
                  <th
                    key={key}
                    className={`${index === 0 ? "aeds-frozen-head" : ""} aeds-align-${getAlignment(field)}`}
                    style={{ width: columnWidths[key] || field.width || 160 }}
                  >
                    <div className="aeds-th-inner">
                      <button type="button" onClick={() => moveColumn(key, "left")} title="Move left">‹</button>

                      <button type="button" className="aeds-th-title" onClick={() => onSort(field)}>
                        <GripVertical size={12} />
                        <span>{getFieldLabel(field)}</span>
                        {renderSortIcon(field)}
                      </button>

                      <button type="button" onClick={() => moveColumn(key, "right")} title="Move right">›</button>

                      <span
                        role="separator"
                        className="aeds-resizer"
                        onDoubleClick={() => setColumnWidths((current) => ({ ...current, [key]: 160 }))}
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect()
                          const delta = event.clientX - rect.left > 4 ? 32 : -32
                          onResize(key, delta)
                        }}
                      />
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {groupedRows
              ? Object.entries(groupedRows).map(([groupValue, groupItems]) => {
                  const groupTotals = calculateTotals(normalizedFields, groupItems)

                  return (
                    <>
                      <tr className="aeds-group-row" key={`group-${groupValue}`}>
                        <td colSpan={normalizedFields.length}>
                          {getFieldLabel(fields.find((field) => getFieldKey(field) === groupKey) || {})}: <strong>{groupValue}</strong>
                          <span>{groupItems.length} row(s)</span>
                        </td>
                      </tr>

                      {groupItems.map(renderRow)}

                      <tr className="aeds-subtotal-row" key={`subtotal-${groupValue}`}>
                        {normalizedFields.map((field, index) => {
                          const key = getFieldKey(field)
                          return (
                            <td key={key} className={`aeds-align-${getAlignment(field)}`}>
                              {index === 0 ? "Sub Total" : groupTotals[key] !== undefined ? formatReportValue(groupTotals[key], field) : ""}
                            </td>
                          )
                        })}
                      </tr>
                    </>
                  )
                })
              : renderedRows.map(renderRow)}

            {!renderedRows.length && (
              <tr>
                <td colSpan={normalizedFields.length} className="aeds-empty-cell">
                  No report data found for selected filters.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              {normalizedFields.map((field, index) => {
                const key = getFieldKey(field)
                return (
                  <td key={key} className={`aeds-align-${getAlignment(field)}`}>
                    {index === 0 ? "Grand Total" : totals[key] !== undefined ? formatReportValue(totals[key], field) : ""}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {filteredRows.length > renderLimit && (
        <div className="aeds-load-more">
          <button type="button" onClick={() => setRenderLimit((current) => current + INITIAL_RENDER_LIMIT)}>
            Load more rows
          </button>
        </div>
      )}
    </section>
  )
}
