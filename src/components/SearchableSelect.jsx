import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, Plus, X } from 'lucide-react'

/**
 * SearchableSelect — a type-to-filter dropdown that matches the app's
 * existing `.input` / `.label` styling, meant as a drop-in replacement
 * for native <select> elements throughout the ERP.
 *
 * Props:
 *  - options: array of { value, label, sublabel? }  (sublabel renders smaller/lighter, e.g. phone or rate)
 *  - value: the currently selected `value` (or '' for none)
 *  - onChange(value): called with the selected option's `value`
 *  - placeholder: text shown when nothing is selected / in the search box
 *  - allowCreate: if true, shows an "+ Add '<query>'" row when no option matches
 *  - onCreate(query): called when the create row is clicked; should resolve to a value to select
 *  - disabled, className: passthrough
 *  - clearable: if true, shows an X to clear the selection
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select…',
  allowCreate = false,
  onCreate,
  disabled = false,
  className = '',
  clearable = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [creating, setCreating] = useState(false)
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  const selected = options.find((o) => o.value === value) || null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) || (o.sublabel || '').toLowerCase().includes(q)
    )
  }, [options, query])

  const exactMatchExists = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return options.some((o) => o.label.toLowerCase() === q)
  }, [options, query])

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false); setQuery('')
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => { if (open) { setHighlight(0); setTimeout(() => inputRef.current?.focus(), 0) } }, [open])

  const choose = (opt) => {
    onChange?.(opt.value)
    setOpen(false); setQuery('')
  }

  const handleCreate = async () => {
    if (!query.trim() || !onCreate) return
    setCreating(true)
    try {
      const newValue = await onCreate(query.trim())
      if (newValue != null) { onChange?.(newValue); setOpen(false); setQuery('') }
    } finally {
      setCreating(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1 + (allowCreate && !exactMatchExists ? 1 : 0))) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight < filtered.length) choose(filtered[highlight])
      else if (allowCreate && !exactMatchExists) handleCreate()
    } else if (e.key === 'Escape') {
      setOpen(false); setQuery('')
    }
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`input w-full flex items-center justify-between text-left ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className={selected ? '' : 'text-pine/40'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {clearable && selected && (
            <X size={14} className="text-pine/40 hover:text-red-500" onClick={(e) => { e.stopPropagation(); onChange?.('') }} />
          )}
          <ChevronDown size={15} className="text-pine/40" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-leaf rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-leaf">
            <Search size={14} className="text-pine/40 shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 outline-none text-sm bg-transparent"
              placeholder="Type to search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((o, i) => (
              <div
                key={o.value}
                onMouseDown={() => choose(o)}
                onMouseEnter={() => setHighlight(i)}
                className={`px-3 py-2 text-sm cursor-pointer flex flex-col ${i === highlight ? 'bg-forest/10' : 'hover:bg-leaf/30'} ${o.value === value ? 'font-semibold text-forest' : ''}`}
              >
                <span>{o.label}</span>
                {o.sublabel && <span className="text-xs text-pine/50">{o.sublabel}</span>}
              </div>
            ))}
            {filtered.length === 0 && !allowCreate && (
              <div className="px-3 py-3 text-sm text-pine/50">No matches.</div>
            )}
            {allowCreate && !exactMatchExists && query.trim() && (
              <div
                onMouseDown={handleCreate}
                onMouseEnter={() => setHighlight(filtered.length)}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-1.5 text-forest font-medium border-t border-leaf/60 ${highlight === filtered.length ? 'bg-forest/10' : 'hover:bg-leaf/30'}`}
              >
                <Plus size={14} /> {creating ? 'Adding…' : `Add "${query.trim()}"`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
