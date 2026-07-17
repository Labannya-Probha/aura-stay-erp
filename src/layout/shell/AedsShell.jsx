/* ------------------------------------------------------------------ */
/*  AEDS v3 SHELL — Single responsive ERP shell                       */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { Menu } from "lucide-react"

import { PATHS } from "../../app/paths"

import { AppTopBar } from "../../components/layout/topbar"

import SidebarShell from "../../components/layout/sidebar/SidebarShell"
import SidebarHeader from "../../components/layout/sidebar/SidebarHeader"
import SidebarNavigation from "../../components/layout/sidebar/SidebarNavigation"
import SidebarFooter from "../../components/layout/sidebar/SidebarFooter"
import SidebarBrandLogo from "../../components/layout/sidebar/SidebarBrandLogo"

import "./shell.css"

export default function AedsShell({
  company,
  role,
  isAdmin,
  userName,
  privileges,
  modulesEnabled,
  children,
}) {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const prevPathnameRef = useRef(location.pathname)

  const softwareName = company?.software_name || "Aura Stay"
  const sidebarHidden = location.pathname === PATHS.CALENDAR

  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname
      setMobileNavOpen(false)
    }
  }, [location.pathname])

  const sidebarContent = useMemo(
    () => (
      <>
        <SidebarHeader
          company={company}
          softwareName={softwareName}
          mobile={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <SidebarNavigation
          role={role}
          isAdmin={isAdmin}
          privileges={privileges}
          modulesEnabled={modulesEnabled}
          onNavigate={() => setMobileNavOpen(false)}
        />

        <SidebarFooter company={company} role={role} userName={userName} />
      </>
    ),
    [
      company,
      softwareName,
      mobileNavOpen,
      role,
      isAdmin,
      privileges,
      modulesEnabled,
      userName,
    ]
  )

  return (
    <div className={sidebarHidden ? "aeds-shell no-sidebar" : "aeds-shell"}>
      {!sidebarHidden && (
        <SidebarShell>
          {sidebarContent}
        </SidebarShell>
      )}

      {mobileNavOpen && !sidebarHidden && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            onClick={() => setMobileNavOpen(false)}
          />

          <SidebarShell mobile>
            {sidebarContent}
          </SidebarShell>
        </div>
      )}

      {!sidebarHidden && (
        <div className="aeds-mobile-bar">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Menu size={22} />
          </button>

          <SidebarBrandLogo
            url={company?.logo_url}
            softwareName={softwareName}
          />

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black leading-tight text-slate-900">
              {softwareName}
            </div>
            {company?.name && (
              <div className="truncate text-[11px] font-semibold text-slate-400">
                {company.name}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="aeds-shell-content">
        <AppTopBar company={company} role={role} />

        <main className="aeds-shell-main">
          <div className="aeds-page-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}