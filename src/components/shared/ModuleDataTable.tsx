import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table'
import LoadingState from 'src/components/feedback/LoadingState'
import EmptyState from 'src/components/feedback/EmptyState'

type TableColumn<T> = {
  key: keyof T | string
  label: string
  align?: 'left' | 'right' | 'center'
  render?: (row: T) => ReactNode
}

type ModuleDataTableProps<T> = {
  columns: Array<TableColumn<T>>
  rows: T[]
  loading?: boolean
  emptyText?: string
  onRowClick?: (row: T) => void
}

export default function ModuleDataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading = false,
  emptyText = 'No data found',
  onRowClick,
}: ModuleDataTableProps<T>) {
  if (loading) {
    return (
      <LoadingState
        variant="table"
        label="Loading records"
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
          description="No matching records found for this view."
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
                key={String(col.key)}
                className={`px-5 py-4 font-semibold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <TableRow
              key={String(row.id || index)}
              className={
                onRowClick ? 'cursor-pointer transition-colors hover:bg-slate-50/80' : undefined
              }
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <TableCell
                  key={String(col.key)}
                  className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                >
                  {col.render ? col.render(row) : (row[col.key as keyof T] ?? '-')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
