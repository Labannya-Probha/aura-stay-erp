import { useEffect } from 'react'
import { X } from 'lucide-react'
import PaymentTerminalForm from './PaymentTerminalForm.jsx'

export default function PaymentTerminalDialog({open,terminal,settlementAccounts,isSaving,onClose,onSubmit}){
  useEffect(()=>{if(!open)return;const fn=e=>{if(e.key==='Escape'&&!isSaving)onClose()};document.addEventListener('keydown',fn);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',fn);document.body.style.overflow=''}},[open,isSaving,onClose])
  if(!open)return null
  return <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40"><button aria-label="Close" className="absolute inset-0" onClick={isSaving?undefined:onClose}/><aside role="dialog" aria-modal="true" className="relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Configuration</p><p className="text-sm text-slate-700">{terminal?.id?(terminal.name||terminal.terminal_name):'New terminal'}</p></div><button onClick={onClose} disabled={isSaving} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100"><X className="h-5 w-5"/></button></div><div className="p-5 sm:p-6"><PaymentTerminalForm initialValue={terminal} settlementAccounts={settlementAccounts} isSaving={isSaving} onCancel={onClose} onSubmit={onSubmit}/></div></aside></div>
}
