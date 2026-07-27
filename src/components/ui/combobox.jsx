import * as React from 'react'
import { CheckIcon, SearchIcon, XIcon } from 'lucide-react'
import { cn } from 'src/lib/utils'

function normalizeItem(item) {
  if (typeof item === 'string') {
    return { value: item, label: item }
  }

  return item ?? { value: '', label: '' }
}

function itemMatchesQuery(item, query) {
  if (!query) return true

  const haystack = [item.label, item.sublabel, item.value].filter(Boolean).join(' ').toLowerCase()

  return haystack.includes(query.toLowerCase())
}

function Combobox({
  items = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  disabled = false,
  className,
  clearable = false,
  allowCreate = false,
  onCreate,
  createLabel = 'Create',
  closeOnSelect = true,
  searchValue,
  onSearchValueChange,
  isLoading = false,
  loadingText = 'Searching...',
  triggerClassName,
  contentClassName,
}) {
  const normalizedItems = React.useMemo(() => items.map(normalizeItem), [items])
  const selectedItem = React.useMemo(
    () => normalizedItems.find((item) => item.value === value) ?? null,
    [normalizedItems, value],
  )

  const [internalQuery, setInternalQuery] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef(null)
  const query = searchValue ?? internalQuery

  const setQuery = React.useCallback(
    (nextValue) => {
      if (onSearchValueChange) {
        onSearchValueChange(nextValue)
        return
      }

      setInternalQuery(nextValue)
    },
    [onSearchValueChange],
  )

  React.useEffect(() => {
    if (open) return
    if (searchValue === undefined) {
      setInternalQuery(selectedItem?.label || '')
    }
    setCreating(false)
  }, [open, searchValue])

  React.useEffect(() => {
    if (open) return
    if (searchValue === undefined) {
      setInternalQuery(selectedItem?.label || '')
    }
  }, [open, searchValue, selectedItem])

  React.useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const filteredItems = React.useMemo(
    () => normalizedItems.filter((item) => itemMatchesQuery(item, query)),
    [normalizedItems, query],
  )

  const canCreate =
    allowCreate &&
    query.trim() &&
    !normalizedItems.some((item) => item.label?.toLowerCase() === query.trim().toLowerCase())

  async function handleCreate() {
    if (!onCreate || !canCreate || creating) return

    try {
      setCreating(true)
      const createdValue = await onCreate(query.trim())
      onChange?.(createdValue ?? query.trim(), {
        value: createdValue ?? query.trim(),
        label: query.trim(),
      })
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  function handleSelect(item) {
    onChange?.(item.value, item)
    if (closeOnSelect) {
      setOpen(false)
    }
  }

  function handleClear(event) {
    event.preventDefault()
    event.stopPropagation()
    onChange?.('', null)
    setQuery('')
    setOpen(true)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('w-full', className)}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          value={open ? query : selectedItem?.label || query}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true)
            if (searchValue === undefined && selectedItem && !query) {
              setQuery(selectedItem.label || '')
            }
          }}
          onChange={(event) => {
            setOpen(true)
            setQuery(event.target.value)
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex h-[38px] w-full items-center rounded-xl border border-slate-200 bg-white px-9 pr-10 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60',
            open && 'ring-2 ring-emerald-500/30',
            triggerClassName,
          )}
        />
        {clearable && selectedItem ? (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault()
              handleClear(event)
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear selection"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className={cn(
            'mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl',
            contentClassName,
          )}
        >
          <div className="max-h-64 overflow-y-auto p-1">
            {isLoading ? (
              <div className="px-3 py-2 text-xs font-semibold text-slate-400">{loadingText}</div>
            ) : null}

            {!isLoading && filteredItems.length ? (
              <div role="listbox" aria-label={searchPlaceholder}>
                {filteredItems.map((item) => {
                  const isSelected = item.value === value

                  return (
                    <button
                      key={String(item.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleSelect(item)
                        setQuery(item.label || '')
                      }}
                      className={cn(
                        'flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50',
                        isSelected && 'bg-emerald-50 text-emerald-900',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {item.sublabel ? (
                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {item.sublabel}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? <CheckIcon className="mt-0.5 size-4 shrink-0" /> : null}
                    </button>
                  )
                })}
              </div>
            ) : null}

            {!isLoading && !filteredItems.length && canCreate ? (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  handleCreate()
                }}
                disabled={creating}
                className="m-1 flex w-[calc(100%-0.5rem)] items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                <span>
                  {createLabel} "{query.trim()}"
                </span>
                {creating ? <span className="text-xs text-slate-500">Saving...</span> : null}
              </button>
            ) : null}

            {!isLoading && !filteredItems.length && !canCreate ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">{emptyText}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { Combobox }
