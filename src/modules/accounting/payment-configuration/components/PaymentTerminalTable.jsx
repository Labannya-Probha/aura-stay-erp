<<<<<<< HEAD
import { Loader2, Pencil, Power, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'

export default function PaymentTerminalTable({
  terminals,
  pendingTerminalId,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] border-collapse">
        <thead className="bg-slate-50">
          <tr className="border-b">
            <H>Terminal</H>
            <H>Code</H>
            <H>Method</H>
            <H>Merchant ID</H>
            <H>Terminal ID</H>
            <H>Settlement account</H>
            <H>Status</H>
            <H align="right">Actions</H>
          </tr>
        </thead>

        <tbody className="divide-y">
          {terminals.map((terminal) => (
            <tr key={terminal.id} className="hover:bg-slate-50">
              <C>
                <p className="font-semibold text-slate-900">{terminal.name}</p>
                {terminal.provider ? (
                  <p className="text-xs text-slate-500">{terminal.provider}</p>
                ) : null}
              </C>
              <C mono>{terminal.code || '—'}</C>
              <C>{terminal.payment_method || 'CARD'}</C>
              <C mono>{terminal.merchant_id || '—'}</C>
              <C mono>{terminal.terminal_id || '—'}</C>
              <C>
                <p className="font-medium">{terminal.settlement_account_name || 'Not mapped'}</p>
                <p className="text-xs text-slate-500">{terminal.settlement_account_code || ''}</p>
              </C>
              <C>
                <StatusBadge active={terminal.is_active} />
              </C>
              <C align="right">
                {pendingTerminalId === terminal.id ? (
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
                )}
              </C>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between border-t px-4 py-3 text-xs text-slate-500">
        <span>
          Showing {terminals.length} terminal{terminals.length === 1 ? '' : 's'}
        </span>
        <span>Tenant-scoped live configuration</span>
      </div>
    </div>
  )
}

function H({ children, align = 'left' }) {
  return (
    <th className={`px-4 py-3 text-${align} text-xs font-semibold uppercase tracking-wider text-slate-500`}>
      {children}
    </th>
  )
}

function C({ children, align = 'left', mono = false }) {
  return (
    <td className={`px-4 py-3.5 text-${align} text-sm text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>
      {children}
    </td>
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
=======
import { Loader2, Pencil, Power, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
export default function PaymentTerminalTable({terminals,pendingTerminalId,onEdit,onToggleStatus,onDelete}){return <div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse"><thead className="bg-slate-50"><tr className="border-b"><H>Terminal</H><H>Code</H><H>Method</H><H>Merchant ID</H><H>Terminal ID</H><H>Settlement account</H><H>Status</H><H align="right">Actions</H></tr></thead><tbody className="divide-y">{terminals.map(t=><tr key={t.id} className="hover:bg-slate-50"><C><p className="font-semibold text-slate-900">{t.name}</p>{t.provider?<p className="text-xs text-slate-500">{t.provider}</p>:null}</C><C mono>{t.code||'—'}</C><C>{t.payment_method||'CARD'}</C><C mono>{t.merchant_id||'—'}</C><C mono>{t.terminal_id||'—'}</C><C><p className="font-medium">{t.settlement_account_name||'Not mapped'}</p><p className="text-xs text-slate-500">{t.settlement_account_code||''}</p></C><C><StatusBadge active={t.is_active}/></C><C align="right">{pendingTerminalId===t.id?<span className="inline-grid h-9 w-9 place-items-center"><Loader2 className="h-4 w-4 animate-spin"/></span>:<div className="inline-flex gap-1"><A label={`Edit ${t.name}`} onClick={()=>onEdit(t)}><Pencil className="h-4 w-4"/></A><A label={`${t.is_active?'Deactivate':'Activate'} ${t.name}`} onClick={()=>onToggleStatus(t)}><Power className="h-4 w-4"/></A><A danger label={`Delete ${t.name}`} onClick={()=>onDelete(t)}><Trash2 className="h-4 w-4"/></A></div>}</C></tr>)}</tbody></table><div className="flex justify-between border-t px-4 py-3 text-xs text-slate-500"><span>Showing {terminals.length} terminal{terminals.length===1?'':'s'}</span><span>Tenant-scoped live configuration</span></div></div>}
function H({children,align='left'}){return <th className={`px-4 py-3 text-${align} text-xs font-semibold uppercase tracking-wider text-slate-500`}>{children}</th>}
function C({children,align='left',mono=false}){return <td className={`px-4 py-3.5 text-${align} text-sm text-slate-700 ${mono?'font-mono text-xs':''}`}>{children}</td>}
function A({label,onClick,children,danger=false}){return <button title={label} aria-label={label} onClick={onClick} className={`grid h-9 w-9 place-items-center rounded-lg ${danger?'text-slate-400 hover:bg-red-50 hover:text-red-600':'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}>{children}</button>}
>>>>>>> feature/pr03-2-payment-configuration
