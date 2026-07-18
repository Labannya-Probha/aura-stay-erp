import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import LoadingOverlay from './LoadingOverlay.jsx'
import PaymentTerminalForm from './PaymentTerminalForm.jsx'
import UnsavedChangesDialog from './UnsavedChangesDialog.jsx'

export default function PaymentTerminalDialog({open,terminal,settlementAccounts,isSaving,error,onClose,onSubmit}){
  const panelRef = useRef(null)
  const [dirty,setDirty] = useState(false)
  const [confirmClose,setConfirmClose] = useState(false)

  const requestClose = useCallback(() => {
    if (isSaving) return
    if (dirty) setConfirmClose(true)
    else onClose()
  },[dirty,isSaving,onClose])

  useEffect(()=>{
    if(!open) return
    const previousFocus = document.activeElement
    const keydown=e=>{
      if(e.key==='Escape'){e.preventDefault();requestClose();return}
      if(e.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if(!focusable?.length) return
      const first=focusable[0], last=focusable[focusable.length-1]
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',keydown)
    document.body.style.overflow='hidden'
    return()=>{document.removeEventListener('keydown',keydown);document.body.style.overflow='';previousFocus?.focus?.()}
  },[open,requestClose])

  useEffect(()=>{if(!open){setDirty(false);setConfirmClose(false)}},[open])
  if(!open)return null

  return <>
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40"><button aria-label="Close payment terminal dialog" className="absolute inset-0" onClick={requestClose}/><aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="payment-terminal-dialog-title" className="relative z-10 h-full w-full overflow-y-auto bg-white shadow-2xl sm:max-w-2xl"><LoadingOverlay visible={isSaving}/><div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Configuration</p><p id="payment-terminal-dialog-title" className="text-sm text-slate-700">{terminal?.id?(terminal.name||terminal.terminal_name):'New terminal'}</p></div><button type="button" aria-label="Close" onClick={requestClose} disabled={isSaving} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5"/></button></div><div className="p-5 sm:p-6"><PaymentTerminalForm initialValue={terminal} settlementAccounts={settlementAccounts} isSaving={isSaving} serverError={error} onDirtyChange={setDirty} onCancel={requestClose} onSubmit={onSubmit}/></div></aside></div>
    <UnsavedChangesDialog open={confirmClose} onContinue={()=>setConfirmClose(false)} onDiscard={()=>{setConfirmClose(false);setDirty(false);onClose()}}/>
  </>
}
