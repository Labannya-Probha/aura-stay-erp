import { useEffect, useRef } from 'react'
import { useLayerFocus } from 'src/hooks/accessibility/useLayerFocus'

// Placeholder — HR letter generation drawer planned for next phase
export default function HrLetterDrawer({ docType, onClose }) {
  const containerRef = useRef(null)

  useLayerFocus({
    open: true,
    containerRef,
    restoreFocus: true,
  })

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

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
        className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="hr-letter-drawer-title" className="font-display font-bold text-pine text-lg">
          {docType || 'Letter'}
        </h2>
        <p className="text-pine/60 text-sm">Letter generation drawer — coming in next phase.</p>
        <button
          type="button"
          data-autofocus
          className="btn-ghost w-full justify-center"
          onClick={() => onClose?.()}
          aria-label="Close HR letter drawer"
        >
          Close
        </button>
      </div>
    </div>
  )
}
