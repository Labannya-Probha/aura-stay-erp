import { formatReportCell } from "../utils/reportFormatters"

export default function MetadataReportTable({ fields = [], rows = [], loading = false }) {
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
      acc[field.fieldKey] = rows.reduce((sum, row) => sum + Number(row[field.fieldKey] || 0), 0)
    }
    return acc
  }, {})

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
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
