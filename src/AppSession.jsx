/* ------------------------------------------------------------------ */
/*  APP SESSION — auth state, company & profile loading                 */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { supabase } from "./lib/supabase"
import { setCurrency } from "./lib/helpers"
import { getTenantId, setTenantId } from "./lib/tenant"
import { PATHS } from "./app/paths"

import Login from "./components/Login.jsx"
import {
  GuestPosKiosk,
  VerifyBillPage as VerifyBill,
  VerifyInvoicePage as VerifyInvoice,
  VerifyPaymentPage as VerifyPayment,
  PreviewReservationPaymentReceiptPage as PreviewReservationPaymentReceipt,
} from "./modules/public/routePages.jsx"
import AppShell from "./AppLayout.jsx"

const TENANT_BRANDING_FIELDS = [
  "logo_url",
  "primary_color",
  "secondary_color",
  "accent_color",
  "sidebar_bg_color",
  "sidebar_text_color",
  "button_color",
  "table_header_color",
  "report_header_color",
  "font_family",
  "theme_mode",
]

function mergeTenantBranding(company, branding) {
  if (!company) return null
  if (!branding) return company

  const nextCompany = { ...company }

  TENANT_BRANDING_FIELDS.forEach((field) => {
    if (branding[field] !== null && branding[field] !== undefined && branding[field] !== "") {
      nextCompany[field] = branding[field]
    }
  })

  return nextCompany
}

function getReservedRouteSegments() {
  return new Set(
    Object.values(PATHS)
      .filter((path) => typeof path === "string" && path.startsWith("/") && !path.startsWith("/:"))
      .map((path) => path.split("/").filter(Boolean)[0])
      .filter(Boolean)
      .map((path) => path.toLowerCase())
  )
}

function getTenantSlugFromPath(pathname) {
  const firstPathPart = pathname.split("/").filter(Boolean)[0]
  if (!firstPathPart) return null

  const reservedPaths = getReservedRouteSegments()
  return reservedPaths.has(firstPathPart.toLowerCase()) ? null : firstPathPart
}

function getLoginSlug(pathname) {
  const pathParts = pathname.split("/").filter(Boolean)
  return pathParts.length > 1 ? pathParts[0] : undefined
}

function getTenantSlugHint(pathname) {
  const pathSlug = getTenantSlugFromPath(pathname)
  if (pathSlug) return pathSlug

  try {
    return sessionStorage.getItem("aura_tenant_slug") || null
  } catch {
    return null
  }
}

function normalizeRole(rawRole) {
  const value = String(rawRole || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")

  if (!value) return null
  if (value === "SUPER_USER") return "SUPERUSER"
  if (value === "FRONT_OFFICE") return "FRONT_OFFICE"
  return value
}

export default function AppSession() {
  const location = useLocation()

  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [privileges, setPrivileges] = useState(null)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const loadCompany = useCallback(
    async (forceTenantId) => {
      let tenantId = forceTenantId || getTenantId()

      if (!tenantId) {
        const slug = getTenantSlugFromPath(location.pathname)

        if (slug) {
          const { data: slugProperty } = await supabase
            .from("properties")
            .select("id")
            .eq("slug", slug)
            .maybeSingle()

          tenantId = slugProperty?.id || null
        }
      }

      if (!tenantId) {
        setCompany(null)
        return null
      }

      const [{ data }, { data: branding }] = await Promise.all([
        supabase
          .from("company_settings")
          .select("*")
          .eq("tenant_id", tenantId)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("tenant_branding")
          .select("*")
          .eq("tenant_id", tenantId)
          .limit(1)
          .maybeSingle(),
      ])

      if (!data) {
        setCompany(null)
        return null
      }

      setCurrency(data.currency || "৳")

      const { data: prop } = await supabase
        .from("properties")
        .select("slug")
        .eq("id", tenantId)
        .limit(1)
        .maybeSingle()

      const nextCompany = mergeTenantBranding({ ...data, slug: prop?.slug || null }, branding)

      setCompany(nextCompany)
      return nextCompany
    },
    [location.pathname]
  )

  useEffect(() => {
    let active = true

    Promise.resolve().then(async () => {
      if (!active) return

      if (!session) {
        setTenantId(null)
        setProfile(null)
        setCompany(null)
        setPrivileges(null)
        return
      }

      const fallbackProfile = {
        role: null,
        full_name: session.user.email?.split("@")[0],
      }

      let tenantIdHint = null
      const slugHint = getTenantSlugHint(location.pathname)

      if (slugHint) {
        const { data: tenantRow } = await supabase
          .from("properties")
          .select("id")
          .eq("slug", slugHint)
          .limit(1)
          .maybeSingle()

        tenantIdHint = tenantRow?.id || null
        if (tenantIdHint) setTenantId(tenantIdHint)
      }

      if (!tenantIdHint) {
        tenantIdHint = getTenantId()
      }

      const { data: profileRows, error } = await supabase
        .from("app_users")
        .select("*")
        .or(`auth_id.eq.${session.user.id},id.eq.${session.user.id}`)

      if (!active) return

      if (error) {
        setProfile(fallbackProfile)
        if (tenantIdHint) {
          setTenantId(tenantIdHint)
          await loadCompany(tenantIdHint)
        } else {
          setTenantId(null)
          await loadCompany(null)
        }
        return
      }

      let selectedProfile = null
      if (Array.isArray(profileRows) && profileRows.length > 0) {
        if (tenantIdHint) {
          selectedProfile = profileRows.find((row) => row.tenant_id === tenantIdHint) || null
        }
        if (!selectedProfile) {
          selectedProfile = profileRows[0]
        }
      }

      if (!selectedProfile) {
        await supabase.auth.signOut()
        setTenantId(null)
        setProfile(null)
        setCompany(null)
        setPrivileges(null)
        return
      }

      const nextProfile = {
        ...(selectedProfile || fallbackProfile),
        role: normalizeRole(selectedProfile?.role || fallbackProfile.role),
      }
      const tenantId = selectedProfile?.tenant_id || tenantIdHint || null

      setProfile(nextProfile)
      setTenantId(tenantId)
      await loadCompany(tenantId)
    })

    return () => {
      active = false
    }
  }, [session, loadCompany])

  useEffect(() => {
    let active = true

    Promise.resolve().then(async () => {
      const role = normalizeRole(profile?.role)
      if (!role || !active) return

      const tenantId = getTenantId()
      let query = supabase
        .from("role_privileges")
        .select("module, can_create, can_view, can_edit, can_delete")
        .eq("role", role)

      if (tenantId) query = query.eq("tenant_id", tenantId)

      const { data: basePrivs } = await query

      if (!active) return

      let nextPrivileges = basePrivs || []

      if (role === "ADMIN") {
        let adminAccessQuery = supabase
          .from("admin_feature_access")
          .select("module, can_access")
          .eq("user_id", profile?.id)

        if (tenantId) adminAccessQuery = adminAccessQuery.eq("tenant_id", tenantId)

        const { data: accessRows } = await adminAccessQuery

        if (accessRows && accessRows.length > 0) {
          const restricted = new Set(
            accessRows.filter((row) => row.can_access === false).map((row) => row.module)
          )

          if (restricted.size > 0) {
            nextPrivileges = nextPrivileges.map((item) =>
              restricted.has(item.module)
                ? { ...item, can_view: false, can_create: false, can_edit: false, can_delete: false }
                : item
            )
          }
        }
      }

      setPrivileges(nextPrivileges)
    })

    return () => {
      active = false
    }
  }, [profile?.role, profile?.id])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-pine/60">
        Loading...
      </div>
    )
  }

  if (location.pathname.endsWith(PATHS.LOGIN)) {
    if (!session) return <Login slug={getLoginSlug(location.pathname)} />
    return <Navigate to={PATHS.DASHBOARD} replace />
  }

  if (!session && location.pathname.startsWith(PATHS.GUEST_KIOSK)) return <GuestPosKiosk />
  if (!session && location.pathname.startsWith(PATHS.VERIFY_BILL.replace(":id", ""))) return <VerifyBill />
  if (!session && location.pathname.startsWith(PATHS.VERIFY_INVOICE.replace(":id", ""))) return <VerifyInvoice />
  if (!session && location.pathname.startsWith(PATHS.VERIFY_PAYMENT.replace(":id", ""))) return <VerifyPayment />
  if (!session && location.pathname === PATHS.PREVIEW_RESERVATION_PAYMENT_RECEIPT) return <PreviewReservationPaymentReceipt />
  if (!session) return <Login />

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-pine/60">
        Loading profile...
      </div>
    )
  }

  const role = normalizeRole(profile?.role)
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center text-slate-600">
        Your user role is not configured for this tenant. Please contact an administrator.
      </div>
    )
  }

  const isAdmin = role === "ADMIN" || role === "SUPERUSER"
  const userName = profile?.full_name || session.user?.email?.split("@")[0] || "User"

  return (
    <AppShell
      company={company}
      role={role}
      isAdmin={isAdmin}
      userName={userName}
      userId={profile?.auth_id || profile?.id}
      loadCompany={loadCompany}
      privileges={privileges}
    />
  )
}
