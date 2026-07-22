import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
} from "lucide-react"

import AedsDataGridToolbar from "./AedsDataGridToolbar"
import AedsDataGridPagination from "./AedsDataGridPagination"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "src/components/ui/table"
import "./aeds-data-grid.css"
import "./aeds-v6-phase5-grid.css"

function columnKey(column) {
  return column?.accessorKey || column?.id || String(column?.header || "column")
}

function formatValue(value, column) {
  if (value === null || value === undefined || value === "") return "—"

  if (column.type === "currency") {
    return `৳${Number(value || 0).toLocaleString("en-BD")}`
  }

  if (column.type === "percent") {
    return `${Number(value || 0).toFixed(2)}%`
  }

  if (column.type === "date") {
    const raw = String(value)
    const date = new Date(
      raw.includes("T") ? raw : `${raw}T00:00:00`
    )

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    }
  }

  return String(value)
}

function alignment(column) {
  return (
    column.align ||
    (["currency", "number", "percent"].includes(column.type)
      ? "right"
      : "left")
  )
}

function statusTone(value) {
  const text = String(value || "").toLowerCase()

  if (/void|cancel|failed|overdue|dirty|out|due/.test(text)) {
    return "danger"
  }

  if (/pending|draft|hold|inspection|tentative/.test(text)) {
    return "warning"
  }

  if (
    /posted|paid|settled|received|clean|confirmed|arrival|departure|in_house|in house/.test(
      text
    )
  ) {
    return "success"
  }

  return ""
}

function isTotalColumn(column) {
  return (
    column.aggregation === "sum" ||
    ["currency", "number"].includes(column.type)
  )
}

function calculateTotals(columns, rows) {
  return columns.reduce((totals, column) => {
    if (isTotalColumn(column)) {
      totals[column.accessorKey] = rows.reduce(
        (sum, row) =>
          sum + Number(row[column.accessorKey] || 0),
        0
      )
    }

    return totals
  }, {})
}

function searchableValue(row, column) {
  const value = row[column.accessorKey]
  return String(value ?? "").toLowerCase()
}

function filterRows(rows, columns, search) {
  const query = String(search || "").trim().toLowerCase()
  if (!query) return rows

  return rows.filter((row) =>
    columns.some((column) =>
      searchableValue(row, column).includes(query)
    )
  )
}

function sortRows(rows, sort) {
  if (!sort?.key) return rows

  const direction = sort.direction === "desc" ? -1 : 1

  return [...rows].sort((first, second) => {
    const firstValue = first[sort.key]
    const secondValue = second[sort.key]

    if (firstValue === secondValue) return 0

    if (
      !Number.isNaN(Number(firstValue)) &&
      !Number.isNaN(Number(secondValue))
    ) {
      return (
        (Number(firstValue) - Number(secondValue)) *
        direction
      )
    }

    return (
      String(firstValue ?? "").localeCompare(
        String(secondValue ?? "")
      ) * direction
    )
  })
}

function groupRows(rows, key) {
  if (!key) return null

  return rows.reduce((groups, row) => {
    const value = row[key] || "Unassigned"

    if (!groups[value]) groups[value] = []
    groups[value].push(row)

    return groups
  }, {})
}

export default function AedsDataGrid({
  title = "Enterprise DataGrid",
  subtitle = "AEDS reusable table engine",
  data = [],
  columns = [],
  pageSize = 100,
  frozenFirstColumn = true,
  loading = false,
  error = "",
  emptyText = "No data found.",
  getRowId = (row, index) => row.id || index,
  onRowClick,
}) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState(null)
  const [groupBy, setGroupBy] = useState("")
  const [page, setPage] = useState(0)
  const [columnWidths, setColumnWidths] = useState({})
  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => columnKey(column))
  )
  const [columnVisibility, setColumnVisibility] = useState({})

  useEffect(() => {
    setColumnOrder((current) => {
      const incoming = columns.map(
        (column) => columnKey(column)
      )

      return [
        ...current.filter((key) => incoming.includes(key)),
        ...incoming.filter((key) => !current.includes(key)),
      ]
    })
  }, [columns])

  useEffect(() => {
    setPage(0)
  }, [search, groupBy, pageSize])

  const visibleColumns = useMemo(() => {
    const byKey = new Map(
      columns.map((column) => [
        columnKey(column),
        column,
      ])
    )

    return columnOrder
      .map((key) => byKey.get(key))
      .filter(Boolean)
      .concat(
        columns.filter(
          (column) =>
            !columnOrder.includes(column.accessorKey)
        )
      )
      .filter(
        (column) =>
          columnVisibility[columnKey(column)] !== false
      )
  }, [columns, columnOrder, columnVisibility])

  const processedRows = useMemo(
    () =>
      sortRows(
        filterRows(data, columns, search),
        sort
      ),
    [data, columns, search, sort]
  )

  const totalPages = Math.max(
    1,
    Math.ceil(processedRows.length / pageSize)
  )

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1))
    }
  }, [page, totalPages])

  const pagedRows = useMemo(
    () =>
      processedRows.slice(
        page * pageSize,
        page * pageSize + pageSize
      ),
    [processedRows, page, pageSize]
  )

  const totals = useMemo(
    () => calculateTotals(visibleColumns, processedRows),
    [visibleColumns, processedRows]
  )

  const grouped = useMemo(
    () => groupRows(pagedRows, groupBy),
    [pagedRows, groupBy]
  )

  const onSort = (column) => {
    if (!column?.accessorKey || column.sortable === false) return

    setSort((current) => {
      if (current?.key !== column.accessorKey) {
        return {
          key: column.accessorKey,
          direction: "asc",
        }
      }

      if (current?.direction === "asc") {
        return {
          key: column.accessorKey,
          direction: "desc",
        }
      }

      return null
    })
  }

  const moveColumn = (key, direction) => {
    setColumnOrder((current) => {
      const next = [...current]
      const index = next.indexOf(key)
      const target =
        direction === "left" ? index - 1 : index + 1

      if (
        index < 0 ||
        target < 0 ||
        target >= next.length
      ) {
        return current
      }

      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)

      return next
    })
  }

  const resizeColumn = (key, delta) => {
    setColumnWidths((current) => ({
      ...current,
      [key]: Math.max(
        100,
        Number(current[key] || 170) + delta
      ),
    }))
  }

  const renderSortIcon = (column) => {
    if (!column?.accessorKey || !sort || sort.key !== column.accessorKey) return null

    return sort.direction === "asc" ? (
      <ArrowUp size={12} />
    ) : (
      <ArrowDown size={12} />
    )
  }

  const renderCell = (row, column, rowIndex) => {
    if (typeof column.cell === "function") {
      return column.cell({
        row,
        value: row[column.accessorKey],
        rowIndex,
      })
    }

    const value = row[column.accessorKey]

    if (column.type === "status") {
      return (
        <span
          className={`aeds-grid-status ${statusTone(value)}`}
        >
          {formatValue(value, column)}
        </span>
      )
    }

    return formatValue(value, column)
  }

  const renderRow = (row, rowIndex) => {
    const rowId = getRowId(row, rowIndex)
    const clickable = typeof onRowClick === "function"

    return (
      <TableRow
        key={rowId}
        className={`aeds-grid-row ${
          clickable ? "aeds-grid-row-clickable" : ""
        }`}
        onClick={
          clickable
            ? () => onRowClick(row, rowIndex)
            : undefined
        }
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault()
                  onRowClick(row, rowIndex)
                }
              }
            : undefined
        }
      >
        {visibleColumns.map((column, columnIndex) => {
          const frozen =
            frozenFirstColumn && columnIndex === 0

          return (
            <TableCell
              key={column.accessorKey}
              className={`aeds-grid-cell aeds-grid-align-${alignment(
                column
              )} ${
                frozen ? "aeds-grid-frozen" : ""
              }`}
              style={{
                width:
                  columnWidths[column.accessorKey] ||
                  column.width ||
                  170,
              }}
            >
              {renderCell(row, column, rowIndex)}
            </TableCell>
          )
        })}
      </TableRow>
    )
  }

  return (
    <section className="aeds-grid-card rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <header className="aeds-grid-header border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            {subtitle} ·{" "}
            {processedRows.length.toLocaleString("en-BD")}{" "}
            row(s)
          </p>
        </div>
      </header>

      <AedsDataGridToolbar
        title={title}
        columns={columns}
        rows={processedRows}
        search={search}
        setSearch={setSearch}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />

      {error && (
        <div className="aeds-grid-message aeds-grid-message-error">
          {error}
        </div>
      )}

      <div className="aeds-grid-wrap overflow-x-auto">
        <Table className="aeds-grid-table min-w-full text-sm">
          <TableHeader>
            <TableRow>
              {visibleColumns.map(
                (column, columnIndex) => {
                  const frozen =
                    frozenFirstColumn &&
                    columnIndex === 0

                  return (
                    <TableHead
                      key={columnKey(column)}
                      className={`aeds-grid-align-${alignment(
                        column
                      )} ${
                        frozen
                          ? "aeds-grid-frozen"
                          : ""
                      }`}
                      style={{
                        width:
                          columnWidths[
                            columnKey(column)
                          ] ||
                          column.width ||
                          170,
                      }}
                    >
                      <div className="aeds-grid-th-inner">
                        <button
                          type="button"
                          className="aeds-grid-th-title"
                          onClick={() => onSort(column)}
                        >
                          <GripVertical size={12} />
                          <span>{column.header}</span>
                          {renderSortIcon(column)}
                        </button>

                        <button
                          type="button"
                          className="aeds-grid-mini"
                          onClick={() =>
                            moveColumn(
                              columnKey(column),
                              "left"
                            )
                          }
                          aria-label={`Move ${column.header} left`}
                        >
                          ‹
                        </button>

                        <button
                          type="button"
                          className="aeds-grid-mini"
                          onClick={() =>
                            moveColumn(
                              columnKey(column),
                              "right"
                            )
                          }
                          aria-label={`Move ${column.header} right`}
                        >
                          ›
                        </button>

                        <span
                          className="aeds-grid-resizer"
                          role="separator"
                          onClick={() =>
                            resizeColumn(
                              columnKey(column),
                              32
                            )
                          }
                          onDoubleClick={() =>
                            setColumnWidths(
                              (current) => ({
                                ...current,
                                [columnKey(column)]: 170,
                              })
                            )
                          }
                        />
                      </div>
                    </TableHead>
                  )
                }
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(
                    1,
                    visibleColumns.length
                  )}
                  className="aeds-grid-empty"
                >
                  Loading data...
                </TableCell>
              </TableRow>
            ) : grouped ? (
              Object.entries(grouped).map(
                ([groupValue, groupedRows]) => {
                  const groupTotals = calculateTotals(
                    visibleColumns,
                    groupedRows
                  )

                  return (
                    <Fragment key={`group-${groupValue}`}>
                      <TableRow className="aeds-grid-group-row">
                        <TableCell
                          colSpan={visibleColumns.length}
                        >
                          {
                            columns.find(
                              (column) =>
                                column.accessorKey ===
                                groupBy
                            )?.header
                          }
                          : <strong>{groupValue}</strong> ·{" "}
                          {groupedRows.length} row(s)
                        </TableCell>
                      </TableRow>

                      {groupedRows.map(renderRow)}

                      <TableRow className="aeds-grid-subtotal">
                        {visibleColumns.map(
                          (column, index) => (
                            <TableCell
                              key={columnKey(column)}
                              className={`aeds-grid-align-${alignment(
                                column
                              )}`}
                            >
                              {index === 0
                                ? "Sub Total"
                                : groupTotals[
                                      column.accessorKey
                                    ] !== undefined
                                  ? formatValue(
                                      groupTotals[
                                        column
                                          .accessorKey
                                      ],
                                      column
                                    )
                                  : ""}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    </Fragment>
                  )
                }
              )
            ) : (
              pagedRows.map(renderRow)
            )}

            {!loading && !pagedRows.length && (
              <TableRow>
                <TableCell
                  colSpan={Math.max(
                    1,
                    visibleColumns.length
                  )}
                  className="aeds-grid-empty"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          {processedRows.length > 0 && (
            <TableFooter>
              <TableRow className="aeds-grid-total">
                {visibleColumns.map(
                  (column, index) => (
                    <TableCell
                      key={columnKey(column)}
                      className={`aeds-grid-align-${alignment(
                        column
                      )}`}
                    >
                      {index === 0
                        ? "Grand Total"
                        : totals[
                              column.accessorKey
                            ] !== undefined
                          ? formatValue(
                              totals[
                                column.accessorKey
                              ],
                              column
                            )
                          : ""}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <AedsDataGridPagination
          page={page}
          pageSize={pageSize}
          totalRows={processedRows.length}
          setPage={setPage}
        />
      </div>
    </section>
  )
}
