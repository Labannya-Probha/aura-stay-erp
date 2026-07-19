import AedsBreadcrumb from "./AedsBreadcrumb"
import AedsCommandPalette from "./AedsCommandPalette"
import AedsSidebarV5 from "./AedsSidebarV5"
import AedsTopbarV5 from "./AedsTopbarV5"
import { useNavigationEngine } from "./useNavigationEngine"
import "./aeds-navigation-engine.css"

export default function AedsNavigationShell({ children, role = "ADMIN", userName = "Admin" }) {
  const nav = useNavigationEngine({ role })

  return (
    <div className="aeds-nav-shell">
      <AedsSidebarV5 items={nav.items} activeItem={nav.activeItem} go={nav.go} favorites={nav.favorites} toggleFavorite={nav.toggleFavorite} />
      <div className="aeds-nav-main">
        <AedsTopbarV5 userName={userName} openCommand={() => nav.setCommandOpen(true)} />
        <main className="aeds-nav-content">
          <AedsBreadcrumb items={nav.breadcrumbs} go={nav.go} />
          {children}
        </main>
      </div>
      <AedsCommandPalette open={nav.commandOpen} onClose={() => nav.setCommandOpen(false)} items={nav.flatItems} go={nav.go} />
    </div>
  )
}
