import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

type UseLayerFocusOptions = {
  open: boolean
  containerRef: RefObject<HTMLElement | null>
  initialFocusSelector?: string
  restoreFocus?: boolean
}

const DEFAULT_SELECTOR =
  '[data-autofocus], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useLayerFocus({
  open,
  containerRef,
  initialFocusSelector = DEFAULT_SELECTOR,
  restoreFocus = true,
}: UseLayerFocusOptions) {
  const previousActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previousActiveRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const timer = window.setTimeout(() => {
      const nextFocus = containerRef.current?.querySelector<HTMLElement>(initialFocusSelector)
      nextFocus?.focus()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [open, containerRef, initialFocusSelector])

  useEffect(() => {
    if (open || !restoreFocus) return
    previousActiveRef.current?.focus?.()
  }, [open, restoreFocus])
}

export default useLayerFocus
