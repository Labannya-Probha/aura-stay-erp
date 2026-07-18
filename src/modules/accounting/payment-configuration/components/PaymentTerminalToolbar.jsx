import { Download, Plus, RefreshCw, Search, X } from 'lucide-react'

const METHODS = [
  { value: 'all', label: 'All methods' },
  { value: 'CARD', label: 'Card' },
  { value: 'MOBILE_BANKING', label: 'Mobile banking' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
]

export default function PaymentTerminalToolbar({
  search,
  methodFilter,
  statusFilter,
  resultCount,
  onSearchChange,
  onMethodFilterChange,
  onStatusFilterChange,
  onClearFilters,
  onExport,
  onRefresh,
  onCreate,
  isRefreshing = false,
}) {
  const hasFilters = Boolean(search || methodFilter !== 'all' || statusFilter !== 'all')

  return (
    <div className="space-y-3 border-b border-slate-200 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_190px_160px]">
          <label className="relative block">
            <span className="sr-only">Search payment terminals</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, code, merchant or terminal ID"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <select
            value={methodFilter}
            onChange={(event) => onMethodFilterChange(event.target.value)}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            aria-label="Filter by payment method"
          >
            {METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            aria-label="Filter by terminal status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          ) : null}

          <button
            type="button"
            onClick={onExport}
            disabled={!resultCount}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        {resultCount} matching terminal{resultCount === 1 ? '' : 's'}
      </div>
    </div>
  )
}
