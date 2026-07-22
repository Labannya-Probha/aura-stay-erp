import { Loader2 } from 'lucide-react'

export default function LoadingOverlay({ visible, label = 'Saving changes…' }) {
  if (!visible) return null
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-white/75 backdrop-blur-[1px]" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        {label}
      </div>
    </div>
  )
}
