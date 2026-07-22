import { useCallback, useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'

type Options = {
  columns: number
  rows: number
  enabled?: boolean
}

const INTERACTIVE_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'])

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (INTERACTIVE_TAGS.has(target.tagName)) return true
  return Boolean(
    target.closest(
      '[contenteditable="true"], [role="button"], [role="menuitem"], [data-grid-interactive="true"]',
    ),
  )
}

export function useGridKeyboardNavigation({ columns, rows, enabled = true }: Options): {
  tableRef: RefObject<HTMLTableElement | null>
  onKeyDown: (event: KeyboardEvent<HTMLTableElement>) => void
} {
  const tableRef = useRef<HTMLTableElement | null>(null)

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableElement>) => {
      if (!enabled || isInteractiveTarget(event.target)) return

      const target = event.target as HTMLElement | null
      const cell = target?.closest<HTMLElement>('[data-grid-cell="true"]')
      if (!cell) return

      const rowIndex = Number(cell.dataset.rowIndex)
      const colIndex = Number(cell.dataset.colIndex)

      if (Number.isNaN(rowIndex) || Number.isNaN(colIndex)) return

      let nextRow = rowIndex
      let nextCol = colIndex

      switch (event.key) {
        case 'ArrowDown':
          nextRow = Math.min(rows - 1, rowIndex + 1)
          break
        case 'ArrowUp':
          nextRow = Math.max(0, rowIndex - 1)
          break
        case 'ArrowRight':
          nextCol = Math.min(columns - 1, colIndex + 1)
          break
        case 'ArrowLeft':
          nextCol = Math.max(0, colIndex - 1)
          break
        case 'Home':
          nextCol = 0
          break
        case 'End':
          nextCol = Math.max(columns - 1, 0)
          break
        default:
          return
      }

      event.preventDefault()
      const selector = `[data-grid-cell="true"][data-row-index="${nextRow}"][data-col-index="${nextCol}"]`
      const nextCell = tableRef.current?.querySelector<HTMLElement>(selector)
      nextCell?.focus()
    },
    [columns, enabled, rows],
  )

  return { tableRef, onKeyDown }
}

export default useGridKeyboardNavigation
