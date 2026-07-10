import { RefreshCw, Search } from "lucide-react"

export default function ReservationListToolbar({ filters, setFilters, onRefresh }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Search size={16} className="text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          placeholder="Search guest, confirmation, room..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <select
        value={filters.status}
        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600"
      >
        <option value="ALL">All status</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="TENTATIVE">Tentative</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="NO_SHOW">No Show</option>
      </select>

      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        <RefreshCw size={16} />
        Refresh
      </button>
    </div>
  )
}
