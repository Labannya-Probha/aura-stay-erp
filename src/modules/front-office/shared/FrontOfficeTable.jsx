import ModuleDataTable from 'src/components/shared/ModuleDataTable'

export default function FrontOfficeTable({
  columns = [],
  rows = [],
  loading = false,
  emptyText = 'No data found',
  onOpen,
}) {
  return (
    <ModuleDataTable
      columns={columns}
      rows={rows}
      loading={loading}
      emptyText={emptyText}
      onRowClick={onOpen ? (row) => onOpen(row.reservationId || row.id) : undefined}
    />
  )
}
