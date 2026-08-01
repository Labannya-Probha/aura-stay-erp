import { useEffect, useRef } from 'react'
import { useLayerFocus } from 'src/hooks/accessibility/useLayerFocus'
import { fmtDate } from '../../../lib/helpers'
import { Button } from 'src/components/ui/button'

/**
 * A-004 fix: previously an unreferenced placeholder ("letter generation
 * drawer planned for next phase") accepting only a `docType` string, with
 * nothing in the app importing it. doc_register only stores docket
 * metadata (date, department, type, subject, party) — there is no letter
 * body/content field anywhere in the schema, so a genuine "generate the
 * letter text" feature would need new columns/content model that don't
 * exist yet. Implemented instead as a real docket detail viewer (the data
 * that does exist), wired into LettersDocumentsTab's new "View" row
 * action, matching the same pattern used for ComplianceDrawer.
 */
export default function HrLetterDrawer({ item, onClose }) {
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
        aria-labelledby="hr-letter-drawer-title"
        className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="hr-letter-drawer-title" className="font-display font-bold text-pine text-lg">
          {item.doc_no || item.doc_type}
        </h2>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Date</dt>
            <dd className="text-pine font-medium">{fmtDate(item.doc_date)}</dd>
          </div>
          <div>
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Type</dt>
            <dd className="text-pine font-medium">{item.doc_type}</dd>
          </div>
          <div>
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Department</dt>
            <dd className="text-pine font-medium">{item.department}</dd>
          </div>
          <div>
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Party</dt>
            <dd className="text-pine font-medium">{item.party || '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Subject</dt>
            <dd className="text-pine">{item.subject}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-pine/50 text-xs uppercase tracking-wide">Created By</dt>
            <dd className="text-pine font-medium">{item.created_by || '—'}</dd>
          </div>
        </dl>

        <p className="text-xs text-pine/40 italic">
          Full letter content generation is not yet implemented — this record currently stores
          docket metadata only.
        </p>

        <Button
          variant="ghost"
          data-autofocus
          className="w-full justify-center"
          onClick={() => onClose?.()}
          aria-label="Close HR letter drawer"
        >
          Close
        </Button>
      </div>
    </div>
  )
}
