import { useEffect, useRef } from 'react'
import { useLayerFocus } from 'src/hooks/accessibility/useLayerFocus'

// Placeholder — compliance detail drawer planned for next phase
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
        className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="compliance-drawer-title" className="font-display font-bold text-pine text-lg">
          Compliance Detail
        </h2>
        <p className="text-pine/60 text-sm">Compliance detail drawer — coming in next phase.</p>
        <button
          type="button"
          data-autofocus
          className="btn-ghost w-full justify-center"
          onClick={() => onClose?.()}
          aria-label="Close compliance drawer"
        >
          Close
        </button>
      </div>
    </div>
  )
}
