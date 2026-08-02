import { AlertTriangle } from 'lucide-react'
import { Button } from 'src/components/ui/button'

export default function UnsavedChangesDialog({ open, onContinue, onDiscard }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/45 p-4" role="presentation">
      <section role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><AlertTriangle className="h-5 w-5"/></div><div><h2 id="unsaved-title" className="text-base font-semibold text-slate-950">Unsaved changes</h2><p className="mt-1 text-sm leading-6 text-slate-600">You have changes that have not been saved. Discard them and close this form?</p></div></div>
        <div className="mt-5 flex justify-end gap-3"><Button autoFocus variant="outline" onClick={onContinue}>Continue editing</Button><Button variant="destructive" onClick={onDiscard}>Discard changes</Button></div>
      </section>
    </div>
  )
}
