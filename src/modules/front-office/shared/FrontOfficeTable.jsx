import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import LoadingState from 'src/components/feedback/LoadingState'
import EmptyState from 'src/components/feedback/EmptyState'

export default function FrontOfficeTable({
  columns = [],
  rows = [],
  loading = false,
  emptyText = 'No data found',
  onOpen,
}) {
  if (loading) {
    return (
      <LoadingState
        variant="table"
        label="Loading front office records"
        rows={6}
        className="rounded-3xl border border-slate-200/80"
      />
    )
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <EmptyState
          variant="table"
          title={emptyText}
          description="No matching reservation or room record found for this view."
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <Table className="w-full text-left text-sm">
        <TableHeader className="bg-slate-50/90 text-xs uppercase tracking-[0.14em] text-slate-500">
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={`px-5 py-4 font-semibold ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <TableRow
              key={row.id || index}
              className="cursor-pointer transition-colors hover:bg-slate-50/80"
              onClick={() => onOpen?.(row.reservationId || row.id)}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.render ? col.render(row) : (row[col.key] ?? '-')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
