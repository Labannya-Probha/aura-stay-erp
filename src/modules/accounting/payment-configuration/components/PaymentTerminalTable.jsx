import { Loader2, Pencil, Power, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import ModuleDataTable from 'src/components/shared/ModuleDataTable'
import ModuleStatusPill from 'src/components/shared/ModuleStatusPill'

const TERMINAL_STATUS_TONES = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
}

export default function PaymentTerminalTable({
  terminals,
  pendingTerminalId,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Terminal',
        render: (terminal) => (
          <div>
            <p className="font-semibold text-slate-900">{terminal.name}</p>
            {terminal.provider ? (
              <p className="text-xs text-slate-500">{terminal.provider}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'code',
        label: 'Code',
        render: (terminal) => <span className="font-data text-xs">{terminal.code || '—'}</span>,
      },
      {
        key: 'payment_method',
        label: 'Method',
        render: (terminal) => terminal.payment_method || 'CARD',
      },
      {
        key: 'merchant_id',
        label: 'Merchant ID',
        render: (terminal) => (
          <span className="font-data text-xs">{terminal.merchant_id || '—'}</span>
        ),
      },
      {
        key: 'terminal_id',
        label: 'Terminal ID',
        render: (terminal) => (
          <span className="font-data text-xs">{terminal.terminal_id || '—'}</span>
        ),
      },
      {
        key: 'settlement_account_name',
        label: 'Settlement account',
        render: (terminal) => (
          <div>
            <p className="font-medium">{terminal.settlement_account_name || 'Not mapped'}</p>
            <p className="text-xs text-slate-500">{terminal.settlement_account_code || ''}</p>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (terminal) => (
          <ModuleStatusPill
            status={terminal.is_active ? 'ACTIVE' : 'INACTIVE'}
            toneMap={TERMINAL_STATUS_TONES}
          />
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        render: (terminal) =>
          pendingTerminalId === terminal.id ? (
            <span className="inline-grid h-9 w-9 place-items-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          ) : (
            <div className="inline-flex gap-1">
              <A label={`Edit ${terminal.name}`} onClick={() => onEdit(terminal)}>
                <Pencil className="h-4 w-4" />
              </A>
              <A
                label={`${terminal.is_active ? 'Deactivate' : 'Activate'} ${terminal.name}`}
                onClick={() => onToggleStatus(terminal)}
              >
                <Power className="h-4 w-4" />
              </A>
              <A danger label={`Delete ${terminal.name}`} onClick={() => onDelete(terminal)}>
                <Trash2 className="h-4 w-4" />
              </A>
            </div>
          ),
      },
    ],
    [onDelete, onEdit, onToggleStatus, pendingTerminalId],
  )

  return (
    <div>
      <ModuleDataTable
        columns={columns}
        rows={terminals}
        emptyText="No payment terminals configured"
      />
      <div className="flex justify-between border-t px-4 py-3 text-xs text-slate-500">
        <span>
          Showing {terminals.length} terminal{terminals.length === 1 ? '' : 's'}
        </span>
        <span>Tenant-scoped live configuration</span>
      </div>
    </div>
  )
}

function A({ label, onClick, children, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg ${danger ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
    >
      {children}
    </button>
  )
}
