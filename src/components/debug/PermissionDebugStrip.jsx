import { ShieldAlert } from 'lucide-react'
import { isUiDebugEnabled } from '../../debug/uiDebug'

export default function PermissionDebugStrip({
  label,
  visibleCount = 0,
  hiddenCount = 0,
  visibleLabel = 'visible',
  hiddenLabel = 'hidden',
  detail,
}) {
  if (!isUiDebugEnabled()) return null

  return (
    <aside className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
      <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.12em] text-amber-900">
        <ShieldAlert size={14} />
        {label}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium">
        <span>
          {visibleCount} {visibleLabel}
        </span>
        <span>
          {hiddenCount} {hiddenLabel}
        </span>
        {detail ? <span>{detail}</span> : null}
      </div>
    </aside>
  )
}
