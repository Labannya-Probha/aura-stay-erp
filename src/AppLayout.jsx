/* ------------------------------------------------------------------ */
/*  APP LAYOUT — AEDS v3 shell                                         */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "./lib/supabase"
import { PATHS } from "./app/paths"
import { getTenantId } from "./lib/tenant"
import { WelcomePopover } from "./components/WelcomePopover.jsx"
import { PopoverDisplay } from "./components/PopoverDisplay.jsx"
import { useWelcomePopover } from "./hooks/useWelcomePopover"
import AppRoutes from "./AppRoutes.jsx"
import AedsShell from "./layout/shell/AedsShell.jsx"
import "./layout/shell/shell.css"
import { useTheme } from "./theme"

export function AppWelcome({ userName }) {
  const { showWelcome, setShowWelcome } = useWelcomePopover()

  return (
    <WelcomePopover
      isOpen={showWelcome}
      userName={userName}
      onClose={() => setShowWelcome(false)}
    />
  )
}

export default function AppShell({
  company,
  role,
  isAdmin,
  userName,
  userId,
  loadCompany,
  privileges,
}) {
  const navigate = useNavigate()
  const { setCompany } = useTheme()
  const [modulesEnabled, setModulesEnabled] = useState(null)

  const withId = (template, id) => template.replace(":id", encodeURIComponent(id))

  const openReservation = (id, tab) => {
    const q = tab ? `?tab=${encodeURIComponent(tab)}` : ""
    navigate(`${withId(PATHS.RESERVATION_DETAIL, id)}${q}`)
  }

  const openFrontOfficeReservation = (id, tab) => {
    const q = tab ? `?tab=${encodeURIComponent(tab)}` : ""
    navigate(`${withId(PATHS.FRONTOFFICE_RESERVATION_DETAIL, id)}${q}`)
  }

  const startReservation = (prefill = {}) => {
    navigate(`${PATHS.RESERVATIONS}?tab=new`, { state: { prefill } })
  }

  useEffect(() => {
    setCompany(company || null)
  }, [company, setCompany])

  useEffect(() => {
    let active = true
    const tenantId = getTenantId()

    if (!tenantId || role === "SUPERUSER") return undefined

    supabase
      .from("tenant_subscriptions")
      .select("modules_enabled,status")
      .eq("tenant_id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        if (!data || data.status === "SUSPENDED") {
          setModulesEnabled(data?.status === "SUSPENDED" ? {} : null)
          return
        }
        setModulesEnabled(data.modules_enabled || null)
      })
      .catch(() => {
        if (active) setModulesEnabled(null)
      })

    return () => {
      active = false
    }
  }, [role, company?.tenant_id])

  return (
    <AedsShell
      company={company}
      role={role}
      isAdmin={isAdmin}
      userName={userName}
      privileges={privileges}
      modulesEnabled={modulesEnabled}
    >
      {company?.maintenance_mode && (
        <div
          className="no-print mb-4 rounded-2xl px-4 py-2 text-center text-sm font-bold text-white"
          style={{ background: "var(--tenant-danger)" }}
        >
          ⚠ Maintenance mode — posting &amp; edits are locked while accounts reconcile.
        </div>
      )}

      <AppRoutes
        role={role}
        isAdmin={isAdmin}
        userName={userName}
        userId={userId}
        company={company}
        privileges={privileges}
        modulesEnabled={modulesEnabled}
        loadCompany={loadCompany}
        openReservation={openReservation}
        openFrontOfficeReservation={openFrontOfficeReservation}
        startReservation={startReservation}
        navigate={navigate}
      />

      <footer className="aeds-fixed-footer no-print">
        <div className="aeds-fixed-footer__inner">
          <span>
            © {new Date().getFullYear()} Aura Stay
          </span>

          <span className="font-semibold text-slate-700">
            Powered by Aura Stay
          </span>
        </div>
      </footer>

      <PopoverDisplay />
      <AppWelcome userName={userName} />
    </AedsShell>
  )
}
