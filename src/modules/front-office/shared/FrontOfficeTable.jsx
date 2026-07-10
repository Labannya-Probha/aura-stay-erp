export default function FrontOfficeTable({ columns = [], rows = [], loading = false, emptyText = "No data found", onOpen }) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-400">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-5 py-4 ${col.align === "right" ? "text-right" : ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.id || index} className="cursor-pointer hover:bg-slate-50" onClick={() => onOpen?.(row.reservationId || row.id)}>
              {columns.map((col) => (
                <td key={col.key} className={`px-5 py-4 ${col.align === "right" ? "text-right" : ""}`}>
                  {col.render ? col.render(row) : row[col.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
