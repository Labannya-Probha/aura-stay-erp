import { formatReportCell } from "../utils/reportFormatters"

function isComparableField(field) {
  return field?.aggregation === "SUM" || /Currency|Number|Percent/i.test(field?.dataType || "")
}

function totalForField(rows, field) {
  return rows.reduce((sum, row) => sum + Number(row?.[field.fieldKey] || 0), 0)
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
    label: key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    dataType: "Text",
    alignment: "left",
  }))

  const activeFields = fields.length ? fields : inferredFields

  const totals = activeFields.reduce((acc, field) => {
    if (field.aggregation === "SUM") {
      acc[field.fieldKey] = totalForField(rows, field)
    }
    return acc
  }, {})

  const comparisonFields = activeFields.filter(isComparableField)
  const comparisonTotals = comparisonFields.reduce((acc, field) => {
    acc[field.fieldKey] = {
      current: totalForField(rows, field),
      previous: totalForField(comparisonRows, field),
    }
    return acc
  }, {})

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      {comparisonSummary?.enabled && comparisonFields.length > 0 && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <span className="rounded-full bg-white px-3 py-1 text-[#1B4D2E]">Comparison enabled</span>
            {comparisonSummary.currentPeriodLabel && <span className="rounded-full bg-white px-3 py-1">{comparisonSummary.currentPeriodLabel}</span>}
            {comparisonSummary.previousPeriodLabel && <span className="rounded-full bg-white px-3 py-1">{comparisonSummary.previousPeriodLabel}</span>}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Metric</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Current</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Previous</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Variance</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Variance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonFields.map((field) => {
                  const currentValue = comparisonTotals[field.fieldKey]?.current || 0
                  const previousValue = comparisonTotals[field.fieldKey]?.previous || 0
                  const variance = currentValue - previousValue
                  const variancePercent = previousValue ? (variance / Math.abs(previousValue)) * 100 : currentValue ? 100 : 0

                  return (
                    <tr key={field.fieldKey} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-700">{field.label}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatReportCell(currentValue, field.dataType, field.displayFormat)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatReportCell(previousValue, field.dataType, field.displayFormat)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatReportCell(variance, field.dataType, field.displayFormat)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatReportCell(variancePercent, "Percent")}</td>
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
                  className={`whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-wide text-[#1B4D2E] ${
                    field.alignment === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50">
                {activeFields.map((field) => (
                  <td
                    key={field.fieldKey}
                    className={`whitespace-nowrap px-4 py-3 font-medium text-slate-700 ${
                      field.alignment === "right" ? "text-right font-mono" : ""
                    }`}
                  >
                    {formatReportCell(row[field.fieldKey], field.dataType, field.displayFormat)}
                  </td>
                ))}
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={Math.max(activeFields.length, 1)} className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>

          {Object.keys(totals).length > 0 && (
            <tfoot className="sticky bottom-0 bg-slate-50">
              <tr>
                {activeFields.map((field, index) => (
                  <td
                    key={field.fieldKey}
                    className={`whitespace-nowrap px-4 py-3 text-sm font-black text-slate-900 ${
                      field.alignment === "right" ? "text-right font-mono" : ""
                    }`}
                  >
                    {index === 0
                      ? "Total"
                      : totals[field.fieldKey] !== undefined
                        ? formatReportCell(totals[field.fieldKey], field.dataType, field.displayFormat)
                        : ""}
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
