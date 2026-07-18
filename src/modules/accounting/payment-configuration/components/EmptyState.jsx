import { CreditCard, Plus } from 'lucide-react'

export default function EmptyState({ onCreate }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <CreditCard className="h-6 w-6 text-slate-500" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">No payment terminal configured</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Add a terminal to define merchant references and map card settlements to an approved bank general ledger account.
      </p>
      <button type="button" onClick={onCreate} className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add First Terminal
      </button>
    </div>
  )
}
