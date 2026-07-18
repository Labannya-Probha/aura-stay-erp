import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { getTenantId } from '../../../lib/tenant.js'
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog.jsx'
import EmptyState from './components/EmptyState.jsx'
import PaymentTerminalDialog from './components/PaymentTerminalDialog.jsx'
import PaymentTerminalTable from './components/PaymentTerminalTable.jsx'
import PaymentTerminalToolbar from './components/PaymentTerminalToolbar.jsx'
import usePaymentConfiguration from './hooks/usePaymentConfiguration.js'
import { exportPaymentTerminalsCsv } from './utils/paymentTerminalExport.js'

export default function PaymentConfigurationPage() {
  const tenantId = getTenantId()
  const [notice, setNotice] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedTerminal, setSelectedTerminal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const {
    terminals,
    settlementAccounts,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    isSaving,
    pendingTerminalId,
    error,
    refresh,
    createTerminal,
    updateTerminal,
    toggleTerminalStatus,
    removeTerminal,
  } = usePaymentConfiguration(tenantId)

  const filteredTerminals = useMemo(
    () =>
      terminals.filter((terminal) => {
        const methodMatches =
          methodFilter === 'all' || terminal.payment_method === methodFilter
        const statusMatches =
          statusFilter === 'all' ||
          (statusFilter === 'active' && terminal.is_active) ||
          (statusFilter === 'inactive' && !terminal.is_active)

        return methodMatches && statusMatches
      }),
    [methodFilter, statusFilter, terminals],
  )

  const summary = useMemo(() => {
    const total = terminals.length
    const active = terminals.filter((terminal) => terminal.is_active).length
    const mappedAccounts = new Set(
      terminals.map((terminal) => terminal.settlement_account_id).filter(Boolean),
    ).size

    return { total, active, inactive: total - active, mappedAccounts }
  }, [terminals])

  const showNotice = useCallback((message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }, [])

  const handleCreate = useCallback(() => {
    setSelectedTerminal(null)
    setEditorOpen(true)
  }, [])

  const handleEdit = useCallback((terminal) => {
    setSelectedTerminal(terminal)
    setEditorOpen(true)
  }, [])

  useEffect(() => {
    function handleShortcut(event) {
      const target = event.target
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement

      if (!isTyping && event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        handleCreate()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        refresh()
      }
    }

    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [handleCreate, refresh])

  const handleSave = useCallback(
    async (payload) => {
      try {
        if (selectedTerminal?.id) {
          await updateTerminal(selectedTerminal.id, payload)
          showNotice('Payment terminal updated successfully.')
        } else {
          await createTerminal(payload)
          showNotice('Payment terminal created successfully.')
        }

        setEditorOpen(false)
        setSelectedTerminal(null)
      } catch {
        // Hook exposes request error.
      }
    },
    [createTerminal, selectedTerminal, showNotice, updateTerminal],
  )

  const handleToggleStatus = useCallback(
    async (terminal) => {
      try {
        await toggleTerminalStatus(terminal)
        showNotice(
          `${terminal.name || terminal.terminal_name} ${
            terminal.is_active ? 'deactivated' : 'activated'
          }.`,
        )
      } catch {
        // Hook exposes request error.
      }
    },
    [showNotice, toggleTerminalStatus],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget?.id) return

    try {
      await removeTerminal(deleteTarget.id)
      showNotice('Payment terminal deleted successfully.')
      setDeleteTarget(null)
    } catch {
      // Hook exposes request error.
    }
  }, [deleteTarget, removeTerminal, showNotice])

  const clearFilters = useCallback(() => {
    setSearch('')
    setMethodFilter('all')
    setStatusFilter('all')
  }, [setSearch])

  return (
    <section className="space-y-5" aria-labelledby="payment-configuration-title">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <CreditCard className="h-5 w-5 text-slate-700" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1
                id="payment-configuration-title"
                className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl"
              >
                Payment Configuration
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Configure card terminals, merchant references and settlement accounts for
                tenant-level payment processing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Terminal
          </button>
        </div>

        <div className="grid border-t border-slate-200 bg-slate-50/70 sm:grid-cols-4">
          <SummaryItem label="Configured" value={summary.total} />
          <SummaryItem label="Active" value={summary.active} />
          <SummaryItem label="Inactive" value={summary.inactive} />
          <SummaryItem label="Settlement accounts" value={summary.mappedAccounts} />
        </div>
      </header>

      {notice ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <PaymentTerminalToolbar
          search={search}
          methodFilter={methodFilter}
          statusFilter={statusFilter}
          resultCount={filteredTerminals.length}
          onSearchChange={setSearch}
          onMethodFilterChange={setMethodFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={clearFilters}
          onExport={() => exportPaymentTerminalsCsv(filteredTerminals)}
          onRefresh={refresh}
          onCreate={handleCreate}
          isRefreshing={isRefreshing}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : filteredTerminals.length ? (
          <PaymentTerminalTable
            terminals={filteredTerminals}
            pendingTerminalId={pendingTerminalId}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={setDeleteTarget}
          />
        ) : (
          <EmptyState onCreate={handleCreate} />
        )}
      </div>

      <PaymentTerminalDialog
        open={editorOpen}
        terminal={selectedTerminal}
        settlementAccounts={settlementAccounts}
        isSaving={isSaving}
        onClose={() => {
          if (!isSaving) {
            setEditorOpen(false)
            setSelectedTerminal(null)
          }
        }}
        onSubmit={handleSave}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        terminal={deleteTarget}
        isDeleting={pendingTerminalId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
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
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-14 rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  )
}
