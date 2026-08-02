import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Save, Trash2 } from 'lucide-react'

type FilterValues = Record<string, unknown>

type SavedView = {
  id: string
  name: string
  filters: FilterValues
  createdAt: string
}

type ReportViewManagerProps = {
  storageKey: string
  currentFilters: FilterValues
  onApply: (filters: FilterValues) => void
}

function readViews(storageKey: string): SavedView[] {
  try {
    const raw = window.localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function ReportViewManager({
  storageKey,
  currentFilters,
  onApply,
}: ReportViewManagerProps) {
  const [views, setViews] = useState<SavedView[]>([])
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    setViews(readViews(storageKey))
    setSelectedId('')
  }, [storageKey])

  const selectedView = useMemo(
    () => views.find((view) => view.id === selectedId),
    [selectedId, views],
  )

  const persist = (nextViews: SavedView[]) => {
    setViews(nextViews)
    window.localStorage.setItem(storageKey, JSON.stringify(nextViews))
  }

  const saveCurrentView = () => {
    const suggested = selectedView?.name || 'My report view'
    const name = window.prompt('Saved view name', suggested)?.trim()
    if (!name) return

    const nextView: SavedView = {
      id: selectedView?.id || crypto.randomUUID(),
      name,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    }

    const nextViews = selectedView
      ? views.map((view) => (view.id === selectedView.id ? nextView : view))
      : [nextView, ...views]

    persist(nextViews)
    setSelectedId(nextView.id)
  }

  const deleteSelectedView = () => {
    if (!selectedView) return
    if (!window.confirm(`Delete saved view “${selectedView.name}”?`)) return
    persist(views.filter((view) => view.id !== selectedView.id))
    setSelectedId('')
  }

  return (
    <div className="report-view-manager">
      <Bookmark size={15} aria-hidden="true" />
      <select
        value={selectedId}
        onChange={(event) => {
          const nextId = event.target.value
          setSelectedId(nextId)
          const nextView = views.find((view) => view.id === nextId)
          if (nextView) onApply(nextView.filters)
        }}
        aria-label="Saved report views"
      >
        <option value="">Saved views</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={saveCurrentView} title="Save current report criteria">
        <Save size={15} />
        Save view
      </button>
      {selectedView ? (
        <button
          type="button"
          onClick={deleteSelectedView}
          className="report-view-delete"
          title="Delete selected saved view"
          aria-label="Delete selected saved view"
        >
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>
  )
}
