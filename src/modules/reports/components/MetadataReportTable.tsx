import { Fragment } from 'react'
import {
  formatReportCell,
  getVarianceToneClass,
  resolveFieldValue,
} from '../utils/reportFormatters'

function isComparableField(field) {
  return field?.aggregation === 'SUM'
}

function totalForField(rows, field) {
  return rows.reduce((sum, row) => sum + Number(resolveFieldValue(row, field.fieldKey) || 0), 0)
}

function formatSectionLabel(value) {
  if (!value) return 'Unclassified'
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getSectionKey(row) {
  return row?.usali_department || row?.department || row?.section || row?.line_group || null
}

export default function MetadataReportTable({
  fields = [],
  rows = [],
  comparisonRows = [],
  comparisonSummary = { enabled: false },
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-400">
        Loading report...
      </div>
    )
  }

  const inferredFields = Object.keys(rows[0] || {}).map((key) => ({
    fieldKey: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    dataType: 'Text',
    alignment: 'left',
  }))

  const activeFields = fields.length ? fields : inferredFields
  const totalField =
    activeFields.find(
      (field) =>
        field.aggregation === 'SUM' || /Currency|Number|Percent/i.test(field.dataType || ''),
    ) || activeFields[0]

  const totals = activeFields.reduce((acc, field) => {
    if (field.aggregation === 'SUM') {
      acc[field.fieldKey] = totalForField(rows, field)
    }
    return acc
  }, {})

  const comparisonFields = activeFields.filter(isComparableField)
  const hasComparativeData = comparisonSummary?.enabled || comparisonRows.length > 0
  const hasExplicitSections = rows.some((row) => getSectionKey(row))
  const groupedRows = hasExplicitSections
    ? rows.reduce((acc, row) => {
        const section = getSectionKey(row) || '__ungrouped__'
        if (!acc[section]) acc[section] = []
        acc[section].push(row)
        return acc
      }, {})
    : {}
  const sectionOrder = Object.keys(groupedRows)
  const comparisonTotals = comparisonFields.reduce((acc, field) => {
    acc[field.fieldKey] = {
      current: totalForField(rows, field),
      previous: totalForField(comparisonRows, field),
    }
    return acc
  }, {})

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_55px_-28px_rgba(27,77,46,0.35)]">
      {hasComparativeData && comparisonFields.length > 0 && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <span className="rounded-full bg-white px-3 py-1 text-[#1B4D2E]">
              Comparison enabled
            </span>
            {comparisonSummary.currentPeriodLabel && (
              <span className="rounded-full bg-white px-3 py-1">
                {comparisonSummary.currentPeriodLabel}
              </span>
            )}
            {comparisonSummary.previousPeriodLabel && (
              <span className="rounded-full bg-white px-3 py-1">
                {comparisonSummary.previousPeriodLabel}
              </span>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                    Current
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                    Previous
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                    Variance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                    Variance %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonFields.map((field) => {
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
                    <tr key={field.fieldKey} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-700">{field.label}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatReportCell(currentValue, field.dataType, field.displayFormat)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatReportCell(previousValue, field.dataType, field.displayFormat)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${varianceClass}`}>
                        {formatReportCell(variance, field.dataType, field.displayFormat)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${varianceClass}`}>
                        {formatReportCell(variancePercent, 'Percent')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="max-h-[560px] overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm report-print-table">
          <thead className="sticky top-0 z-10 bg-[#F7F4EC]">
            <tr>
              {activeFields.map((field) => (
                <th
                  key={field.fieldKey}
                  className={`whitespace-nowrap px-5 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#4B5B4E] ${
                    field.alignment === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {sectionOrder.length > 0
              ? sectionOrder.map((sectionKey) => {
                  const sectionRows = groupedRows[sectionKey]
                  const sectionLabel = formatSectionLabel(sectionKey)
                  const sectionTotal = sectionRows.reduce((sum, row) => {
                    const value = resolveFieldValue(row, totalField.fieldKey)
                    return sum + Number(value || 0)
                  }, 0)

                  return (
                    <Fragment key={sectionKey}>
                      <tr className="erp-group-row border-b border-[#e7dfce] bg-[#F7F4EC] text-[#1B4D2E]">
                        <td
                          colSpan={activeFields.length}
                          className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em]"
                        >
                          {sectionLabel}
                        </td>
                      </tr>
                      {sectionRows.map((row, rowIndex) => (
                        <tr key={`${sectionKey}-${rowIndex}`} className="hover:bg-[#FCFBF7]">
                          {activeFields.map((field) => {
                            const cellValue = resolveFieldValue(row, field.fieldKey)
                            const varianceClass = /variance/i.test(field.fieldKey || '')
                              ? getVarianceToneClass(row, cellValue)
                              : ''

                            return (
                              <td
                                key={field.fieldKey}
                                className={`whitespace-nowrap px-5 py-4 text-[0.94rem] font-medium text-slate-700 ${
                                  field.alignment === 'right' ? 'text-right font-mono' : ''
                                } ${varianceClass}`.trim()}
                              >
                                {formatReportCell(cellValue, field.dataType, field.displayFormat)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                      {sectionKey !== '__ungrouped__' && totalField?.aggregation === 'SUM' ? (
                        <tr className="erp-subtotal-row border-t border-[#e7dfce] bg-[#FCFBF7]">
                          <td className="px-5 py-4 text-sm font-black text-slate-900">
                            Section Total
                          </td>
                          <td
                            className="px-5 py-4 text-right text-sm font-black text-slate-900"
                            colSpan={activeFields.length - 1}
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
              : rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-[#FCFBF7]">
                    {activeFields.map((field) => {
                      const cellValue = resolveFieldValue(row, field.fieldKey)
                      const varianceClass = /variance/i.test(field.fieldKey || '')
                        ? getVarianceToneClass(row, cellValue)
                        : ''

                      return (
                        <td
                          key={field.fieldKey}
                          className={`whitespace-nowrap px-5 py-4 text-[0.94rem] font-medium text-slate-700 ${
                            field.alignment === 'right' ? 'text-right font-mono' : ''
                          } ${varianceClass}`.trim()}
                        >
                          {formatReportCell(cellValue, field.dataType, field.displayFormat)}
                        </td>
                      )
                    })}
                  </tr>
                ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(activeFields.length, 1)}
                  className="px-5 py-12 text-center text-sm font-semibold text-slate-400"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>

          {Object.keys(totals).length > 0 && (
            <tfoot className="sticky bottom-0 bg-slate-50">
              <tr className="erp-grandtotal-row border-t border-[#d9d2c2] bg-[#F7F4EC]">
                {activeFields.map((field, index) => (
                  <td
                    key={field.fieldKey}
                    className={`whitespace-nowrap px-5 py-4 text-sm font-black text-slate-900 ${
                      field.alignment === 'right' ? 'text-right font-mono' : ''
                    }`}
                  >
                    {index === 0
                      ? 'Total'
                      : totals[field.fieldKey] !== undefined
                        ? formatReportCell(
                            totals[field.fieldKey],
                            field.dataType,
                            field.displayFormat,
                          )
                        : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
