import { Bell, Mail, Menu, Search, Sun, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

export default function AedsTopbar({ userName = "Ankur Dutta" }) {
  return (
    <header className="aeds-v5-topbar">
      <Button variant="ghost" size="icon"><Menu size={18} /></Button>
      <div className="aeds-v5-search">
        <Search size={16} /><Input placeholder="Search anything..." /><kbd>⌘K</kbd>
      </div>
      <div className="aeds-v5-topbar-actions">
        <Button variant="ghost" size="icon"><Sun size={18} /></Button>
        <Button variant="ghost" size="icon"><Bell size={18} /></Button>
        <Button variant="ghost" size="icon"><Mail size={18} /></Button>
        <Button><Plus size={16} /> New</Button>
        <div className="aeds-v5-user"><Avatar><AvatarFallback>{userName?.slice(0,1) || "A"}</AvatarFallback></Avatar><div><strong>{userName}</strong><span>Administrator</span></div></div>
      </div>
    </header>
  )
}
