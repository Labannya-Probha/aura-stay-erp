import { Pencil, Power, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'

export default function PaymentTerminalTable({ terminals, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1050px] w-full border-collapse">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <HeaderCell>Terminal</HeaderCell><HeaderCell>Code</HeaderCell><HeaderCell>Method</HeaderCell>
            <HeaderCell>Merchant ID</HeaderCell><HeaderCell>Terminal ID</HeaderCell><HeaderCell>Settlement account</HeaderCell>
            <HeaderCell>Status</HeaderCell><HeaderCell align="right">Actions</HeaderCell>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {terminals.map((terminal) => (
            <tr key={terminal.id} className="transition hover:bg-slate-50/80">
              <BodyCell><p className="font-semibold text-slate-900">{terminal.name}</p>{terminal.description ? <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{terminal.description}</p> : null}</BodyCell>
              <BodyCell mono>{terminal.code || '—'}</BodyCell>
              <BodyCell>{terminal.payment_method || 'CARD'}</BodyCell>
              <BodyCell mono>{terminal.merchant_id || '—'}</BodyCell>
              <BodyCell mono>{terminal.terminal_id || '—'}</BodyCell>
              <BodyCell><p className="font-medium text-slate-800">{terminal.settlement_account_name || 'Not mapped'}</p>{terminal.settlement_account_code ? <p className="mt-0.5 text-xs text-slate-500">{terminal.settlement_account_code}</p> : null}</BodyCell>
              <BodyCell><StatusBadge active={terminal.is_active} /></BodyCell>
              <BodyCell align="right">
                <div className="inline-flex items-center gap-1">
                  <ActionButton label={`Edit ${terminal.name}`} onClick={() => onEdit(terminal)}><Pencil className="h-4 w-4" /></ActionButton>
                  <ActionButton label={`${terminal.is_active ? 'Deactivate' : 'Activate'} ${terminal.name}`} onClick={() => onToggleStatus(terminal)}><Power className="h-4 w-4" /></ActionButton>
                  <ActionButton label={`Delete ${terminal.name}`} onClick={() => onDelete(terminal)} danger><Trash2 className="h-4 w-4" /></ActionButton>
                </div>
              </BodyCell>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <span>Showing {terminals.length} terminal{terminals.length === 1 ? '' : 's'}</span>
        <span>Pagination will be connected with Supabase in Commit 3.</span>
      </div>
    </div>
  )
}

function HeaderCell({ children, align = 'left' }) {
  const alignClass = align === 'right' ? 'text-right' : 'text-left'
  return <th scope="col" className={`sticky top-0 z-10 px-4 py-3 ${alignClass} text-xs font-semibold uppercase tracking-[0.08em] text-slate-500`}>{children}</th>
}

function BodyCell({ children, align = 'left', mono = false }) {
  const alignClass = align === 'right' ? 'text-right' : 'text-left'
  return <td className={`px-4 py-3.5 ${alignClass} text-sm text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>{children}</td>
}

function ActionButton({ label, onClick, children, danger = false }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${danger ? 'border-transparent text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600' : 'border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-700'}`}>
      {children}
    </button>
  )
}
