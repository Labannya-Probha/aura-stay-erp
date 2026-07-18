import { Button } from "src/components/ui/button"

export default function AedsDataGridPagination({ page, pageSize, totalRows, setPage }) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  return (
    <div className="aeds-grid-pagination">
      <div>Page {page + 1} of {totalPages} · {totalRows.toLocaleString("en-BD")} row(s)</div>
      <div className="aeds-grid-pagination-actions">
        <Button variant="outline" size="sm" type="button" disabled={page === 0} onClick={() => setPage(0)}>First</Button>
        <Button variant="outline" size="sm" type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Prev</Button>
        <Button variant="outline" size="sm" type="button" disabled={page >= totalPages - 1} onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}>Next</Button>
      </div>
    </div>
  )
}
