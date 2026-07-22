import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"

export default function FrontOfficeTable({ columns = [], rows = [], loading = false, emptyText = "No data found", onOpen }) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded-3xl border border-slate-200/80 bg-slate-100/80" />
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-400 shadow-sm">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <Table className="w-full text-left text-sm">
        <TableHeader className="bg-slate-50/90 text-xs uppercase tracking-[0.14em] text-slate-500">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={`px-5 py-4 font-semibold ${col.align === "right" ? "text-right" : ""}`}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <TableRow key={row.id || index} className="cursor-pointer transition-colors hover:bg-slate-50/80" onClick={() => onOpen?.(row.reservationId || row.id)}>
              {columns.map((col) => (
                <TableCell key={col.key} className={`px-5 py-4 ${col.align === "right" ? "text-right" : ""}`}>
                  {col.render ? col.render(row) : row[col.key] ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
