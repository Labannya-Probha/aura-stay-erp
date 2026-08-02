import { Fragment, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  ExternalLink,
  Rows3,
  RotateCcw,
} from 'lucide-react'

import {
  formatReportCell,
  getVarianceToneClass,
  resolveFieldValue,
} from '../utils/reportFormatters'

type Density = 'compact' | 'comfortable' | 'spacious'
type SortDirection = 'asc' | 'desc'

type SortState = {
  fieldKey: string
  direction: SortDirection
} | null

function isNumericField(field: any) {
  return (
    field?.alignment === 'right' ||
    field?.aggregation === 'SUM' ||
    /Currency|Number|Percent|Decimal|Integer/i.test(field?.dataType || '')
  )
}

function isComparableField(field: any) {
  return field?.aggregation === 'SUM' || isNumericField(field)
}

function totalForField(rows: any[], field: any) {
  return rows.reduce((sum, row) => sum + Number(resolveFieldValue(row, field.fieldKey) || 0), 0)
}

function formatSectionLabel(value: unknown) {
  if (!value) return 'Unclassified'
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getSectionKey(row: any) {
  return row?.usali_department || row?.department || row?.section || row?.line_group || 'main'
}

function compareValues(left: unknown, right: unknown, numeric: boolean) {
  if (numeric) {
    const a = Number(left ?? 0)
    const b = Number(right ?? 0)
    return a - b
  }

  return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

function rowKey(row: any, index: number) {
  return (
    row?.id ||
    row?.uuid ||
    row?.entry_id ||
    row?.journal_line_id ||
    row?.document_no ||
    row?.reference ||
    index
  )
}

export default function MetadataReportTable({
  fields = [],
  rows = [],
  comparisonRows = [],
  comparisonSummary = { enabled: false },
  loading = false,
  onRowOpen,
}: {
  fields?: any[]
  rows?: any[]
  comparisonRows?: any[]
  comparisonSummary?: any
  loading?: boolean
  onRowOpen?: (row: any) => void
}) {
  const inferredFields = useMemo(
    () =>
      Object.keys(rows[0] || {}).map((key) => ({
        fieldKey: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        dataType: 'Text',
        alignment: 'left',
      })),
    [rows],
  )

  const allFields = fields.length ? fields : inferredFields
  const [density, setDensity] = useState<Density>('comfortable')
  const [sortState, setSortState] = useState<SortState>(null)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [columnMenuOpen, setColumnMenuOpen] = useState(false)

  const activeFields = useMemo(
    () => allFields.filter((field: any) => !hiddenColumns.has(field.fieldKey)),
    [allFields, hiddenColumns],
  )

  const sortedRows = useMemo(() => {
    if (!sortState) return rows

    const field = allFields.find((item: any) => item.fieldKey === sortState.fieldKey)
    const numeric = isNumericField(field)

    return [...rows].sort((left, right) => {
      const result = compareValues(
        resolveFieldValue(left, sortState.fieldKey),
        resolveFieldValue(right, sortState.fieldKey),
        numeric,
      )
      return sortState.direction === 'asc' ? result : -result
    })
  }, [rows, sortState, allFields])

  const totalField =
    activeFields.find((field: any) => field.aggregation === 'SUM' || isNumericField(field)) ||
    activeFields[0]

  const totals = useMemo(
    () =>
      activeFields.reduce((acc: Record<string, number>, field: any) => {
        if (field.aggregation === 'SUM') {
          acc[field.fieldKey] = totalForField(rows, field)
        }
        return acc
      }, {}),
    [activeFields, rows],
  )

  const comparisonFields = activeFields.filter(isComparableField)
  const hasComparativeData = comparisonSummary?.enabled || comparisonRows.length > 0

  const groupedRows = useMemo(
    () =>
      sortedRows.reduce((acc: Record<string, any[]>, row: any) => {
        const section = getSectionKey(row)
        if (!acc[section]) acc[section] = []
        acc[section].push(row)
        return acc
      }, {}),
    [sortedRows],
  )

  const sectionOrder = Object.keys(groupedRows)

  const comparisonTotals = useMemo(
    () =>
      comparisonFields.reduce((acc: Record<string, any>, field: any) => {
        acc[field.fieldKey] = {
          current: totalForField(rows, field),
          previous: totalForField(comparisonRows, field),
        }
        return acc
      }, {}),
    [comparisonFields, rows, comparisonRows],
  )

  const densityClass = {
    compact: 'report-table-density-compact',
    comfortable: 'report-table-density-comfortable',
    spacious: 'report-table-density-spacious',
  }[density]

  const toggleSort = (field: any) => {
    setSortState((current) => {
      if (!current || current.fieldKey !== field.fieldKey) {
        return { fieldKey: field.fieldKey, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { fieldKey: field.fieldKey, direction: 'desc' }
      }
      return null
    })
  }

  const toggleColumn = (fieldKey: string) => {
    setHiddenColumns((current) => {
      const next = new Set(current)
      if (next.has(fieldKey)) next.delete(fieldKey)
      else if (activeFields.length > 1) next.add(fieldKey)
      return next
    })
  }

  if (loading) {
    return <div className="report-table-loading">Loading report data…</div>
  }

  return (
    <section className="enterprise-report-table">
      <header className="report-table-toolbar no-print">
        <div className="report-table-toolbar__summary">
          <strong>{rows.length.toLocaleString()}</strong>
          <span>records</span>
          <span className="report-table-toolbar__divider" />
          <span>{activeFields.length} visible columns</span>
          {sortState ? (
            <>
              <span className="report-table-toolbar__divider" />
              <span>
                Sorted by{' '}
                {allFields.find((field: any) => field.fieldKey === sortState.fieldKey)?.label}
              </span>
            </>
          ) : null}
        </div>

        <div className="report-table-toolbar__actions">
          <div className="report-table-segmented" aria-label="Table density">
            {(['compact', 'comfortable', 'spacious'] as Density[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDensity(option)}
                className={density === option ? 'is-active' : ''}
                title={`${option} row density`}
                aria-pressed={density === option}
              >
                <Rows3 size={14} />
                <span>{option}</span>
              </button>
            ))}
          </div>

          <div className="report-column-control">
            <button
              type="button"
              className="report-table-tool-button"
              onClick={() => setColumnMenuOpen((open) => !open)}
              aria-expanded={columnMenuOpen}
            >
              <Columns3 size={15} />
              Columns
            </button>

            {columnMenuOpen ? (
              <div className="report-column-menu">
                <div className="report-column-menu__header">
                  <div>
                    <strong>Visible columns</strong>
                    <span>Keep at least one column visible.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHiddenColumns(new Set())}
                    title="Restore all columns"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>

                <div className="report-column-menu__list">
                  {allFields.map((field: any) => (
                    <label key={field.fieldKey}>
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.has(field.fieldKey)}
                        onChange={() => toggleColumn(field.fieldKey)}
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {hasComparativeData && comparisonFields.length > 0 ? (
        <section className="report-comparison-summary">
          <header>
            <div>
              <strong>Comparative summary</strong>
              <span>
                {comparisonSummary.currentPeriodLabel || 'Current period'} against{' '}
                {comparisonSummary.previousPeriodLabel || 'previous period'}
              </span>
            </div>
          </header>

          <div className="report-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="numeric">Current</th>
                  <th className="numeric">Previous</th>
                  <th className="numeric">Variance</th>
                  <th className="numeric">Variance %</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFields.map((field: any) => {
                  const currentValue = comparisonTotals[field.fieldKey]?.current || 0
                  const previousValue = comparisonTotals[field.fieldKey]?.previous || 0
                  const variance = currentValue - previousValue
                  const variancePercent = previousValue
                    ? (variance / Math.abs(previousValue)) * 100
                    : currentValue
                      ? 100
                      : 0
                  const varianceClass = getVarianceToneClass(
                    { usali_line_group: field?.usaliLineGroup },
                    variance,
                  )

                  return (
                    <tr key={field.fieldKey}>
                      <td>{field.label}</td>
                      <td className="numeric">
                        {formatReportCell(currentValue, field.dataType, field.displayFormat)}
                      </td>
                      <td className="numeric">
                        {formatReportCell(previousValue, field.dataType, field.displayFormat)}
                      </td>
                      <td className={`numeric ${varianceClass}`}>
                        {formatReportCell(variance, field.dataType, field.displayFormat)}
                      </td>
                      <td className={`numeric ${varianceClass}`}>
                        {formatReportCell(variancePercent, 'Percent')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className={`report-table-scroll report-table-main ${densityClass}`}>
        <table className="report-print-table">
          <thead>
            <tr>
              {activeFields.map((field: any) => {
                const sorted = sortState?.fieldKey === field.fieldKey
                const SortIcon = !sorted
                  ? ArrowUpDown
                  : sortState?.direction === 'asc'
                    ? ArrowUp
                    : ArrowDown

                return (
                  <th
                    key={field.fieldKey}
                    className={isNumericField(field) ? 'numeric' : undefined}
                    aria-sort={
                      sorted
                        ? sortState?.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button type="button" onClick={() => toggleSort(field)}>
                      <span>{field.label}</span>
                      <SortIcon size={13} aria-hidden="true" />
                    </button>
                  </th>
                )
              })}
              {onRowOpen ? <th className="report-row-action-column no-print">Open</th> : null}
            </tr>
          </thead>

          <tbody>
            {sectionOrder.length > 0
              ? sectionOrder.map((sectionKey) => {
                  const sectionRows = groupedRows[sectionKey]
                  const sectionLabel = formatSectionLabel(sectionKey)
                  const sectionTotal = totalField
                    ? sectionRows.reduce((sum, row) => {
                        const value = resolveFieldValue(row, totalField.fieldKey)
                        return sum + Number(value || 0)
                      }, 0)
                    : 0

                  return (
                    <Fragment key={sectionKey}>
                      <tr className="report-group-row">
                        <td colSpan={activeFields.length + (onRowOpen ? 1 : 0)}>
                          {sectionLabel}
                          <span>{sectionRows.length} records</span>
                        </td>
                      </tr>

                      {sectionRows.map((row, rowIndex) => (
                        <tr
                          key={rowKey(row, rowIndex)}
                          className={onRowOpen ? 'is-drillable' : undefined}
                          onDoubleClick={onRowOpen ? () => onRowOpen(row) : undefined}
                        >
                          {activeFields.map((field: any) => {
                            const cellValue = resolveFieldValue(row, field.fieldKey)
                            const varianceClass = /variance/i.test(field.fieldKey || '')
                              ? getVarianceToneClass(row, cellValue)
                              : ''
                            const labelField = ['account_name', 'particulars', 'label'].includes(
                              field.fieldKey,
                            )
                            const noteRef = labelField ? row?.notes_reference : null

                            return (
                              <td
                                key={field.fieldKey}
                                className={`${isNumericField(field) ? 'numeric' : ''} ${varianceClass}`.trim()}
                              >
                                <span className="report-cell-value">
                                  {formatReportCell(cellValue, field.dataType, field.displayFormat)}
                                </span>
                                {noteRef ? (
                                  <a
                                    href={`/reports/notes#note-${noteRef}`}
                                    className="report-note-reference"
                                    title={`See Note ${noteRef}`}
                                  >
                                    [{noteRef}]
                                  </a>
                                ) : null}
                              </td>
                            )
                          })}

                          {onRowOpen ? (
                            <td className="report-row-action-column no-print">
                              <button
                                type="button"
                                onClick={() => onRowOpen(row)}
                                aria-label="Open report record"
                              >
                                <ExternalLink size={14} />
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ))}

                      {totalField ? (
                        <tr className="report-subtotal-row">
                          <td>Section total</td>
                          <td
                            className="numeric"
                            colSpan={Math.max(activeFields.length - 1 + (onRowOpen ? 1 : 0), 1)}
                          >
                            {formatReportCell(
                              sectionTotal,
                              totalField.dataType,
                              totalField.displayFormat,
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })
              : sortedRows.map((row, rowIndex) => (
                  <tr
                    key={rowKey(row, rowIndex)}
                    className={onRowOpen ? 'is-drillable' : undefined}
                    onDoubleClick={onRowOpen ? () => onRowOpen(row) : undefined}
                  >
                    {activeFields.map((field: any) => {
                      const cellValue = resolveFieldValue(row, field.fieldKey)
                      const varianceClass = /variance/i.test(field.fieldKey || '')
                        ? getVarianceToneClass(row, cellValue)
                        : ''

                      return (
                        <td
                          key={field.fieldKey}
                          className={`${isNumericField(field) ? 'numeric' : ''} ${varianceClass}`.trim()}
                        >
                          {formatReportCell(cellValue, field.dataType, field.displayFormat)}
                        </td>
                      )
                    })}

                    {onRowOpen ? (
                      <td className="report-row-action-column no-print">
                        <button type="button" onClick={() => onRowOpen(row)}>
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}

            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(activeFields.length + (onRowOpen ? 1 : 0), 1)}
                  className="report-table-empty"
                >
                  No data found for the selected criteria.
                </td>
              </tr>
            ) : null}
          </tbody>

          {Object.keys(totals).length > 0 ? (
            <tfoot>
              <tr>
                {activeFields.map((field: any, index: number) => (
                  <td
                    key={field.fieldKey}
                    className={isNumericField(field) ? 'numeric' : undefined}
                  >
                    {index === 0
                      ? 'Grand total'
                      : totals[field.fieldKey] !== undefined
                        ? formatReportCell(
                            totals[field.fieldKey],
                            field.dataType,
                            field.displayFormat,
                          )
                        : ''}
                  </td>
                ))}
                {onRowOpen ? <td className="no-print" /> : null}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  )
}
