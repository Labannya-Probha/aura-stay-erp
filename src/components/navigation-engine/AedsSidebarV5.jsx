import { ChevronDown, ChevronRight, Star } from "lucide-react"
import { NAV_GROUP_LABELS } from "./navigationRegistry"
import { useState } from "react"

export default function AedsSidebarV5({ items, activeItem, go, favorites, toggleFavorite }) {
  const [openGroups, setOpenGroups] = useState({})
  const grouped = items.reduce((acc, item) => {
    const group = item.group || "main"
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})
  const toggleOpen = (id) => setOpenGroups((current) => ({ ...current, [id]: !current[id] }))

  return (
    <aside className="aeds-nav-sidebar">
      <div className="aeds-nav-brand">
        <div className="aeds-nav-brand-mark">A</div>
        <div><div className="aeds-nav-brand-title">AURA STAY</div><div className="aeds-nav-brand-sub">Enterprise ERP</div></div>
      </div>

      {Object.entries(grouped).map(([group, groupItems]) => (
        <section key={group}>
          <div className="aeds-nav-group-label">{NAV_GROUP_LABELS[group] || group}</div>
          {groupItems.map((item) => {
            const Icon = item.icon
            const hasChildren = (item.children || []).length > 0
            const active = activeItem?.id === item.id || activeItem?.parentId === item.id
            const open = openGroups[item.id] || active
            return (
              <div key={item.id}>
                <button type="button" className={`aeds-nav-parent ${active ? "active" : ""}`} onClick={() => hasChildren ? toggleOpen(item.id) : go(item.path)}>
                  {Icon && <Icon size={18} />}
                  <span>{item.label}</span>
                  <button type="button" className="aeds-topbar-btn" onClick={(event) => { event.stopPropagation(); toggleFavorite(item) }}>
                    <Star size={13} fill={favorites.some((favorite) => favorite.path === item.path) ? "currentColor" : "none"} />
                  </button>
                  {hasChildren ? (open ? <ChevronDown size={15} /> : <ChevronRight size={15} />) : null}
                </button>
                {hasChildren && open && (
                  <div className="aeds-nav-children">
                    {item.children.map((child) => (
                      <button type="button" key={child.id} className={`aeds-nav-child ${activeItem?.id === child.id ? "active" : ""}`} onClick={() => go(child.path)}>
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      ))}

      <div className="aeds-nav-footer"><div className="aeds-nav-mini-card"><strong>Tenant Online</strong>Secure · Synced · Protected</div></div>
    </aside>
  )
}
