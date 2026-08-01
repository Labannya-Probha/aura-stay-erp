import { useEffect, useRef } from 'react'
import { useLayerFocus } from 'src/hooks/accessibility/useLayerFocus'
import { fmtDate } from '../../../lib/helpers'
import { Button } from 'src/components/ui/button'

/**
 * A-004 fix: previously an unreferenced placeholder ("compliance detail
 * drawer planned for next phase") that nothing in the app actually
 * imported. Implemented as a real incident-detail viewer, wired into
 * IncidentsView's new "View" row action — every field shown here comes
 * from the same incident_register row the table already renders, no new
 * data source invented.
 */
export default function ComplianceDrawer({ item, onClose }) {
  const containerRef = useRef(null)

  useLayerFocus({
    open: Boolean(item),
    containerRef,
    restoreFocus: true,
  })

  useEffect(() => {
    if (!item) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [item, onClose])

  if (!item) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={() => onClose?.()}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-drawer-title"
        className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="compliance-drawer-title" className="font-display font-bold text-pine text-lg">
            Compliance Incident
          </h2>
          <span className={`status-chip ${item.status === 'OPEN' ? 'bg-amber/20 text-amber' : 'bg-forest/15 text-forest'}`}>
            {item.status}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Date</dt>
            <dd className="text-pine font-medium">{fmtDate(item.incident_date)}</dd>
          </div>
          <div>
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Category</dt>
            <dd className="text-pine font-medium">{item.category}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Description</dt>
            <dd className="text-pine">{item.description}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Action Taken</dt>
            <dd className="text-pine">{item.action_taken || '—'}</dd>
          </div>
          <div>
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Reported By</dt>
            <dd className="text-pine font-medium">{item.reported_by}</dd>
          </div>
        </dl>

        <Button
          variant="ghost"
          data-autofocus
          className="w-full justify-center"
          onClick={() => onClose?.()}
          aria-label="Close compliance drawer"
        >
          Close
        </Button>
      </div>
    </div>
  )
}
