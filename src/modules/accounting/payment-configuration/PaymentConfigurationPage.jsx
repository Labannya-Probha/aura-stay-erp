import { useCallback, useMemo, useState } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import EmptyState from './components/EmptyState.jsx'
import PaymentTerminalTable from './components/PaymentTerminalTable.jsx'
import PaymentTerminalToolbar from './components/PaymentTerminalToolbar.jsx'
import usePaymentConfiguration from './hooks/usePaymentConfiguration.js'

export default function PaymentConfigurationPage() {
  const [notice, setNotice] = useState('')
  const {
    terminals,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    error,
    refresh,
    toggleTerminalStatus,
    removeTerminal,
  } = usePaymentConfiguration()

  const summary = useMemo(() => {
    const total = terminals.length
    const active = terminals.filter((terminal) => terminal.is_active).length
    return { total, active, inactive: total - active }
  }, [terminals])

  const showNotice = useCallback((message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }, [])

  const handleCreate = useCallback(() => {
    showNotice('Terminal form will be connected in Commit 3.')
  }, [showNotice])

  const handleEdit = useCallback((terminal) => {
    showNotice(`Edit form for ${terminal.name} will be connected in Commit 3.`)
  }, [showNotice])

  const handleToggleStatus = useCallback(async (terminal) => {
    try {
      await toggleTerminalStatus(terminal)
    } catch {
      // Error is exposed by the hook.
    }
  }, [toggleTerminalStatus])

  const handleDelete = useCallback(async (terminal) => {
    const confirmed = window.confirm(`Remove "${terminal.name}" from payment configuration?`)
    if (!confirmed) return

    try {
      await removeTerminal(terminal.id)
    } catch {
      // Error is exposed by the hook.
    }
  }, [removeTerminal])

  return (
    <section className="space-y-5" aria-labelledby="payment-configuration-title">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <CreditCard className="h-5 w-5 text-slate-700" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 id="payment-configuration-title" className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Payment Configuration
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Configure card terminals, merchant references and settlement accounts for tenant-level payment processing.
              </p>
            </div>
          </div>

          <button type="button" onClick={handleCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Terminal
          </button>
        </div>

        <div className="grid border-t border-slate-200 bg-slate-50/70 sm:grid-cols-3">
          <SummaryItem label="Configured" value={summary.total} />
          <SummaryItem label="Active" value={summary.active} />
          <SummaryItem label="Inactive" value={summary.inactive} />
        </div>
      </header>

      {notice ? <div role="status" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{notice}</div> : null}
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <PaymentTerminalToolbar
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onCreate={handleCreate}
          isRefreshing={isRefreshing}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : terminals.length ? (
          <PaymentTerminalTable
            terminals={terminals}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState onCreate={handleCreate} />
        )}
      </div>
    </section>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div className="border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="animate-pulse p-5" aria-label="Loading payment terminals">
      <div className="h-10 rounded-lg bg-slate-100" />
      <div className="mt-3 space-y-3">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-14 rounded-lg bg-slate-100" />)}
      </div>
    </div>
  )
}
