import { BarChart3, BedDouble, Boxes, CalendarDays, ClipboardCheck, FileBarChart, Home, Hotel, Settings, Utensils, Users } from "lucide-react"

const nav = [
  ["Dashboard", Home], ["Front Office", Hotel], ["Reservations", CalendarDays],
  ["Housekeeping", BedDouble], ["Restaurant (POS)", Utensils], ["Inventory", Boxes],
  ["Accounting", FileBarChart], ["Reports", BarChart3], ["HR & Payroll", Users],
  ["Tasks & Approvals", ClipboardCheck], ["Settings", Settings],
]

export default function AedsSidebar({ active = "Dashboard" }) {
  return (
    <aside className="aeds-v5-sidebar">
      <div className="aeds-v5-brand">
        <div className="aeds-v5-brand-mark">A</div>
        <div><div className="aeds-v5-brand-title">AURA STAY</div><div className="aeds-v5-brand-sub">Enterprise ERP</div></div>
      </div>
      <div className="aeds-v5-nav-section">MAIN</div>
      <nav className="aeds-v5-nav">
        {nav.map(([label, Icon]) => (
          <button key={label} className={label === active ? "active" : ""}>
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="aeds-v5-sidebar-footer"><span>●</span><strong>Light Mode</strong></div>
    </aside>
  )
}
