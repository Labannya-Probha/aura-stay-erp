/* ------------------------------------------------------------------ */
/*  AEDS v3 SHELL — Single responsive ERP shell                       */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

import { PATHS } from '../../app/paths'

import { AppTopBar } from '../../components/layout/topbar'

import SidebarShell from '../../components/layout/sidebar/SidebarShell'
import SidebarHeader from '../../components/layout/sidebar/SidebarHeader'
import SidebarNavigation from '../../components/layout/sidebar/SidebarNavigation'
import SidebarFooter from '../../components/layout/sidebar/SidebarFooter'
import { Button } from '../../components/ui/button'

import './shell.css'

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

  const softwareName = company?.software_name || 'Aura Stay'
  const companyName = company?.name?.trim() || ''
  const showCompanyName = Boolean(
    companyName && companyName.toLowerCase() !== softwareName.trim().toLowerCase(),
  )
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
    [company, softwareName, mobileNavOpen, role, isAdmin, privileges, modulesEnabled, userName],
  )

  return (
    <div className={sidebarHidden ? 'aeds-shell no-sidebar' : 'aeds-shell'}>
      {!sidebarHidden && <SidebarShell>{sidebarContent}</SidebarShell>}

      {mobileNavOpen && !sidebarHidden && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            onClick={() => setMobileNavOpen(false)}
          />

          <SidebarShell mobile>{sidebarContent}</SidebarShell>
        </div>
      )}

      {!sidebarHidden && (
        <div className="aeds-mobile-bar">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
            className="aeds-mobile-menu-trigger"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black leading-tight tracking-tight text-slate-900">
              {softwareName}
            </div>
            {showCompanyName && (
              <div className="truncate text-[11px] font-semibold tracking-[0.01em] text-slate-500">
                {companyName}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="aeds-shell-content">
        <AppTopBar company={company} role={role} />

        <main className="aeds-shell-main">
          <div className="aeds-page-container">{children}</div>
        </main>
      </div>
    </div>
  )
}
