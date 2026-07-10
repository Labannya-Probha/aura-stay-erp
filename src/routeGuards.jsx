/* ------------------------------------------------------------------ */
/*  ROUTE GUARDS & ROUTE HELPER COMPONENTS                             */
/* ------------------------------------------------------------------ */
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { can } from './lib/roles'
import { isModuleEnabled } from './lib/saasModules'
import { SaasModuleBlocked, SaasModuleFrame } from './components/saas/SaasModuleFrame.jsx'
import { firstAccessiblePath } from './app/navigation/helpers'
import { PATHS } from './app/paths'
import FrontOfficeReservationDetailPage from './modules/front-office/FrontOfficeReservationDetailPage.jsx'
import LegacyReservationsPage from './modules/reservations/LegacyReservationsPage.jsx'
import ReservationDetailPage from './modules/reservations/ReservationDetailPage.jsx'

/* ------------------------------------------------------------------ */
/*  GuardedRoute                                                        */
/* ------------------------------------------------------------------ */
// Use can() for both loaded privileges and fallback role defaults. This avoids
// blank guarded pages if the role_privileges query is still loading or fails.
export function GuardedRoute({ role, navId, privileges, modulesEnabled = null, children }) {
  if (!isModuleEnabled(navId, modulesEnabled, role)) {
    return <SaasModuleBlocked moduleId={navId} />
  }
  if (!can(role, navId, privileges)) return <Navigate to={firstAccessiblePath(role, privileges, modulesEnabled)} replace />
  return children
}

/* ------------------------------------------------------------------ */
/*  SaasModuleRoute                                                     */
/* ------------------------------------------------------------------ */
export function SaasModuleRoute({ moduleId, role, navId, privileges, modulesEnabled, company, userName, children }) {
  return (
    <GuardedRoute role={role} navId={navId || moduleId} privileges={privileges} modulesEnabled={modulesEnabled}>
      <SaasModuleFrame moduleId={moduleId} company={company} role={role} userName={userName}>
        {children}
      </SaasModuleFrame>
    </GuardedRoute>
  )
}

/* ------------------------------------------------------------------ */
/*  TenantReportsRedirect                                               */
/* ------------------------------------------------------------------ */
export function TenantReportsRedirect() {
  const { slug } = useParams()
  return <Navigate to={PATHS.TENANT_REPORTS.replace(':slug', slug)} replace />
}

/* ------------------------------------------------------------------ */
/*  Route helpers                                                       */
/* ------------------------------------------------------------------ */
export function ReservationsRoute({ openReservation, userName }) {
  const location     = useLocation()
  const navigate     = useNavigate()
  const prefill      = location.state?.prefill || null
  const clearPrefill = () => navigate(location.pathname, { replace: true, state: {} })
  return <LegacyReservationsPage openReservation={openReservation} userName={userName} prefill={prefill} clearPrefill={clearPrefill} />
}

export function ReservationModuleRoute({ userName, role, isAdmin }) {
  const { id }   = useParams()
  const navigate = useNavigate()
  return <ReservationDetailPage id={id} back={() => navigate(PATHS.RESERVATIONS)} userName={userName} role={role} isAdmin={isAdmin} />
}

export function FrontOfficeReservationRoute({ userName, role, isAdmin }) {
  const { id }   = useParams()
  const navigate = useNavigate()
  return <FrontOfficeReservationDetailPage id={id} back={() => navigate(PATHS.FRONT_OFFICE)} userName={userName} role={role} isAdmin={isAdmin} />
}
