import { useMemo, useState } from 'react'
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog.jsx'
import PaymentTerminalDialog from './components/PaymentTerminalDialog.jsx'
import PaymentTerminalTable from './components/PaymentTerminalTable.jsx'
import usePaymentConfiguration from './hooks/usePaymentConfiguration.js'

export default function PaymentConfigurationPage({ tenantId }) {
  const {
    terminals,
    settlementAccounts,
    loading,
    saving,
    error,
    search,
    setSearch,
    createTerminal,
    updateTerminal,
    toggleTerminalStatus,
    removeTerminal,
    refresh,
  } = usePaymentConfiguration(tenantId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedTerminal, setSelectedTerminal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const activeCount = useMemo(
    () => terminals.filter((terminal) => terminal.is_active).length,
    [terminals],
  )

  const openCreate = () => {
    setSelectedTerminal(null)
    setEditorOpen(true)
  }

  const openEdit = (terminal) => {
    setSelectedTerminal(terminal)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    if (saving) return
    setEditorOpen(false)
    setSelectedTerminal(null)
  }

  const handleSave = async (payload) => {
    if (selectedTerminal?.id) {
      await updateTerminal(selectedTerminal.id, payload)
      setNotice('Payment terminal updated successfully.')
    } else {
      await createTerminal(payload)
      setNotice('Payment terminal created successfully.')
    }

    setEditorOpen(false)
    setSelectedTerminal(null)
  }

  const handleToggleStatus = async (terminal) => {
    await toggleTerminalStatus(terminal)
    setNotice(`Terminal ${terminal.is_active ? 'deactivated' : 'activated'} successfully.`)
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    await removeTerminal(deleteTarget.id)
    setDeleteTarget(null)
    setNotice('Payment terminal deleted successfully.')
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Payment Configuration</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage payment terminals, settlement accounts and processing controls.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="aeds-button-secondary" onClick={refresh} disabled={loading || saving}>
            Refresh
          </button>
          <button type="button" className="aeds-button-primary" onClick={openCreate}>
            Add terminal
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Configured terminals" value={terminals.length} />
        <KpiCard label="Active terminals" value={activeCount} />
        <KpiCard label="Settlement accounts" value={settlementAccounts.length} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <label className="sr-only" htmlFor="payment-terminal-search">Search terminals</label>
          <input
            id="payment-terminal-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by terminal, code, provider or method"
            className="aeds-input"
          />
        </div>
        <p className="text-sm text-slate-500">
          Showing <strong className="text-slate-800">{terminals.length}</strong> terminal(s)
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{notice}</span>
          <button type="button" className="font-semibold" onClick={() => setNotice('')}>Dismiss</button>
        </div>
      ) : null}

      <PaymentTerminalTable
        terminals={terminals}
        loading={loading}
        saving={saving}
        onEdit={openEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={setDeleteTarget}
      />

      <PaymentTerminalDialog
        open={editorOpen}
        onClose={closeEditor}
        initialValue={selectedTerminal}
        settlementAccounts={settlementAccounts}
        saving={saving}
        onSubmit={handleSave}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        terminal={deleteTarget}
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </section>
  )
}

function KpiCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}
