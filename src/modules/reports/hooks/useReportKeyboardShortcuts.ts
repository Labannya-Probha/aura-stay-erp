import { useEffect } from 'react'

type ShortcutActions = {
  onRun?: () => void
  onPrint?: () => void
  onExcel?: () => void
  onFilterFocus?: () => void
  onFullscreen?: () => void
}

export function useReportKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (typing && event.key !== 'Escape') return

      const ctrlOrMeta = event.ctrlKey || event.metaKey
      if (ctrlOrMeta && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        actions.onPrint?.()
      } else if (ctrlOrMeta && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        actions.onExcel?.()
      } else if (ctrlOrMeta && event.key === '/') {
        event.preventDefault()
        actions.onFilterFocus?.()
      } else if (event.altKey && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        actions.onRun?.()
      } else if (event.altKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        actions.onFullscreen?.()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [actions])
}
