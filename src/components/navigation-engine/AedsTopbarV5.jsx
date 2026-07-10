import { Bell, Mail, Menu, Moon, Plus, Search } from "lucide-react"

export default function AedsTopbarV5({ userName = "Admin", openCommand }) {
  return (
    <header className="aeds-nav-topbar">
      <button type="button" className="aeds-topbar-btn"><Menu size={18} /></button>
      <button type="button" className="aeds-nav-search" onClick={openCommand}>
        <Search size={17} /><span>Search pages, modules, reports...</span><kbd>Ctrl K</kbd>
      </button>
      <button type="button" className="aeds-topbar-btn"><Plus size={16} />New</button>
      <button type="button" className="aeds-topbar-btn"><Moon size={17} /></button>
      <button type="button" className="aeds-topbar-btn"><Bell size={17} /></button>
      <button type="button" className="aeds-topbar-btn"><Mail size={17} /></button>
      <div className="aeds-nav-user"><div className="aeds-nav-avatar">{userName?.slice(0,1) || "A"}</div><div><strong>{userName}</strong><span>Administrator</span></div></div>
    </header>
  )
}
