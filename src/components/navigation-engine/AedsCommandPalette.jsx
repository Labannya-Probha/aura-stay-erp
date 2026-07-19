import { Search, X } from "lucide-react"
import { useMemo, useState } from "react"

export default function AedsCommandPalette({ open, onClose, items = [], go }) {
  const [query, setQuery] = useState("")
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 30)
    return items.filter((item) => `${item.label} ${item.parentLabel || ""} ${item.path}`.toLowerCase().includes(q)).slice(0, 30)
  }, [items, query])

  if (!open) return null

  return (
    <>
      <div className="aeds-command-backdrop" onClick={onClose} />
      <section className="aeds-command-panel" role="dialog" aria-modal="true">
        <div className="aeds-command-search">
          <Search size={20} />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, modules, reports..." />
          <button className="aeds-topbar-btn" type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="aeds-command-list">
          {results.map((item) => {
            const Icon = item.icon
            return (
              <button key={`${item.id}-${item.path}`} className="aeds-command-item" type="button" onClick={() => go(item.path)}>
                {Icon && <Icon size={18} />}
                <div><strong>{item.label}</strong><span>{item.parentLabel || item.group || "Aura Stay ERP"} · {item.path}</span></div>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
