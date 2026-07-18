import { AlertTriangle } from 'lucide-react'

export default function UnsavedChangesDialog({ open, onContinue, onDiscard }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/45 p-4" role="presentation">
      <section role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><AlertTriangle className="h-5 w-5"/></div><div><h2 id="unsaved-title" className="text-base font-semibold text-slate-950">Unsaved changes</h2><p className="mt-1 text-sm leading-6 text-slate-600">You have changes that have not been saved. Discard them and close this form?</p></div></div>
        <div className="mt-5 flex justify-end gap-3"><button autoFocus type="button" onClick={onContinue} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Continue editing</button><button type="button" onClick={onDiscard} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Discard changes</button></div>
      </section>
    </div>
  )
}
