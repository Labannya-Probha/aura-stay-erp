/* ------------------------------------------------------------------ */
/*  SIDEBAR NAVIGATION — AEDS v3 Enterprise Navigation                 */
/* ------------------------------------------------------------------ */
import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronDown, Search, X } from "lucide-react"

import { can } from "../../../lib/roles"
import { isModuleEnabled } from "../../../lib/saasModules"
import { REPORT_CATEGORIES } from "../../../lib/reporting/reportConfig"
import { getRoleDefaultReportCatalog } from "../../../lib/reporting/tenantReporting"

import { NAV_GROUPS } from "../../../app/navigation/navGroups"
import {
  SIDEBAR_ACCOUNTING_TABS,
  SIDEBAR_HR_TABS,
  SIDEBAR_MASTER_DATA_TABS,
} from "../../../app/navigation/sidebarTabs"
import { getVisibleSettingsSections } from "../../../app/navigation/settingsSections"
import { PATHS } from "../../../app/paths"
import { FRONT_OFFICE_PAGES, frontOfficePath, normalizeFrontOfficeSlug } from "../../../modules/front-office/frontOffice.config"
import "../../../styles/aeds-v6-migration.css"

import {
  DEFAULT_RESERVATION_TAB,
  getVisibleReservationTabs,
  resolveReservationTab,
} from "../../../modules/reservations/reservations.config"
import { SidebarContent, SidebarInput } from "src/components/ui/sidebar"
import { Button } from "src/components/ui/button"

const EXPANDABLE_MODULES = new Set([
  "reservations",
  "nightaudit",
  "pos",
  "inventory",
  "accounting",
  "hr",
  "reports",
  "tasks",
  "master-data",
  "settings",
])

const VALID_TASK_TABS = new Set(["my", "all", "ai"])

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function cleanReportSlug(name) {
  return slugify(
    String(name || "")
      .replace(/\breport\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  )
}

function normalizeReportDepartment(report, category) {
  return (
    report.departmentSlug ||
    report.department_slug ||
    slugify(report.department || report.categoryName || category?.name || report.category || "reports")
  )
}

function normalizeReportSlug(report) {
  return report.slug || report.reportSlug || report.report_slug || cleanReportSlug(report.name || report.reportName || report.title || report.code)
}

function buildReportPath(report, category) {
  return `/reports/${normalizeReportDepartment(report, category)}/${normalizeReportSlug(report)}`
}

function getSearchParam(location, key) {
  return new URLSearchParams(location.search).get(key)
}

function getTopSegment(pathname) {
  return pathname.split("/").filter(Boolean)[0] || "dashboard"
}

function getCurrentTopId(pathname) {
  const segment = getTopSegment(pathname)

  if (segment === "dashboard") return "dashboard"
  if (segment === "frontoffice" || segment === "front-office") return "nightaudit"
  if (segment === "consumption") return "inventory"
  if (segment === "cms" || segment === "master-data") return "master-data"
  if (segment === "night-audit-reports") return "reports"
  if (segment === "restaurant") return "pos"

  return segment
}

function modulePathById(id) {
  switch (id) {
    case "dashboard":
      return PATHS.DASHBOARD

    case "nightaudit":
      return `${PATHS.FRONT_OFFICE}?tab=in-house`

    case "reservations":
      return `${PATHS.RESERVATIONS}?tab=${DEFAULT_RESERVATION_TAB || "calendar"}`

    case "reports":
      return PATHS.REPORTS || "/reports"

    case "accounting":
      return PATHS.ACCOUNTING || "/accounting"

    case "inventory":
      return PATHS.INVENTORY || "/inventory"

    case "pos":
      return PATHS.RESTAURANT || PATHS.POS || "/restaurant"

    case "pos-print-center":
      return PATHS.POS_PRINT_CENTER || "/pos/print-center"

    case "master-data":
      return PATHS.MASTER_DATA || "/master-data"

    case "settings":
      return PATHS.SETTINGS || "/settings"

    case "tasks":
      return PATHS.TASKS || "/tasks"

    default:
      return `/${id}`
  }
}

function isReservationRoute(pathname) {
  return (
    pathname.startsWith("/reservations") ||
    pathname === PATHS.RESERVATION_PAYMENTS ||
    pathname === PATHS.CALENDAR ||
    pathname === PATHS.BOOKING_CALENDAR ||
    pathname === PATHS.CRM
  )
}

function isFrontOfficeRoute(pathname) {
  return (
    pathname.startsWith("/frontoffice") ||
    pathname.startsWith("/front-office") ||
    pathname === PATHS.NIGHTAUDIT ||
    pathname === PATHS.FACILITIES
  )
}

function isRestaurantRoute(pathname) {
  return (
    pathname.startsWith("/restaurant") ||
    pathname === PATHS.POS ||
    pathname === PATHS.MENU_MANAGEMENT ||
    pathname.startsWith("/pos/print-center") ||
    pathname === PATHS.GUEST_KIOSK ||
    pathname.startsWith("/verify/pos/") ||
    pathname.startsWith("/verify/invoice/") ||
    pathname.startsWith("/verify/payment/")
  )
}

function isAccountingRoute(pathname) {
  return pathname.startsWith("/accounting") || pathname === PATHS.VAT || pathname === PATHS.VAT_RETURN
}

function isReportsRoute(pathname) {
  return (
    pathname === (PATHS.REPORTS || "/reports") ||
    pathname === PATHS.REPORTS_CASED_ALIAS ||
    pathname === PATHS.NIGHT_AUDIT_REPORTS ||
    pathname.startsWith("/reports/")
  )
}

function isTasksRoute(pathname) {
  return pathname === PATHS.TASKS || pathname === PATHS.AI_TASKER
}

function buildRouteSystemMenu({ pathname, currentTopId }) {
  if (currentTopId === "settings") return "settings"
  if (currentTopId === "master-data") return "master-data"
  if (isTasksRoute(pathname)) return "tasks"
  if (isReportsRoute(pathname)) return "reports"
  if (pathname.startsWith("/hr")) return "hr"
  if (isAccountingRoute(pathname)) return "accounting"
  if (currentTopId === "inventory") return "inventory"
  if (isRestaurantRoute(pathname)) return "pos"
  if (isFrontOfficeRoute(pathname)) return "nightaudit"
  if (isReservationRoute(pathname)) return "reservations"
  return currentTopId || null
}

function isModuleVisible(item, { role, isAdmin, privileges, modulesEnabled, visibleReservationTabs }) {
  if (!isModuleEnabled(item.id, modulesEnabled, role)) return false

  if (item.id === "nightaudit") {
    return (
      can(role, "dashboard", privileges) ||
      can(role, "nightaudit", privileges) ||
      can(role, "facilities", privileges)
    )
  }

  if (item.id === "reservations") return visibleReservationTabs.length > 0
  if (item.id === "master-data") return role === "SUPERUSER" && can(role, "cms", privileges)
  if (item.id === "settings") return isAdmin || role === "SUPERUSER" || can(role, "settings", privileges)

  return can(role, item.id, privileges)
}

function NavButton({ item, active, open, expandable, onClick }) {
  const Icon = item.icon

  return (
    <Button
      type="button"
      variant="ghost"
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active || open
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-white/40"
          : "text-white/80 hover:bg-white/12 hover:text-white"
      }`}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        {Icon && <Icon size={17} className="shrink-0" />}
        <span className="min-w-0 truncate whitespace-nowrap">{item.label}</span>
      </span>

      {expandable && (
        <ChevronDown size={13} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
      )}
    </Button>
  )
}

function ChildButton({ child, onNavigate }) {
  const Icon = child.icon

  return (
    <Button
      type="button"
      variant="ghost"
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
        child.active
          ? "bg-white/18 text-white"
          : child.path
            ? "text-white/75 hover:bg-white/10 hover:text-white"
            : "cursor-default text-white/50"
      }`}
      onClick={() => child.path && onNavigate(child.path)}
    >
      {Icon && <Icon size={13} aria-hidden="true" className="shrink-0 opacity-70" />}
      <span className="min-w-0 truncate">{child.label}</span>
    </Button>
  )
}

function SubGroup({ group, onNavigate }) {
  const [open, setOpen] = useState(group.active)

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
          group.active ? "font-semibold text-white" : "text-white/75 hover:text-white"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {group.icon && <group.icon size={12} className="shrink-0 opacity-70" />}
          <span className="min-w-0 truncate">{group.label}</span>
        </span>
        <ChevronDown size={10} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
      </Button>

      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {group.children.map((child) => (
            <ChildButton key={child.id} child={child} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

function buildSettingsChildren({ role, isAdmin, location }) {
  return getVisibleSettingsSections({ role, isAdmin }).map((section) => ({
    ...section,
    path: `${PATHS.SETTINGS}?section=${section.id}`,
    active: getTopSegment(location.pathname) === "settings" && location.search.includes(`section=${section.id}`),
  }))
}

function buildMasterDataChildren(location) {
  const mdTab = getSearchParam(location, "tab") || "companies"

  return SIDEBAR_MASTER_DATA_TABS.map((tab) => ({
    ...tab,
    path: `${PATHS.MASTER_DATA || PATHS.CMS}?tab=${tab.id}`,
    active:
      (location.pathname === PATHS.MASTER_DATA || location.pathname === PATHS.CMS) &&
      mdTab === tab.id,
  }))
}

function buildReservationChildren({ location, visibleReservationTabs }) {
  const requestedTab = getSearchParam(location, "tab")
  const resolvedTab = resolveReservationTab(requestedTab, visibleReservationTabs)
  const activeTab = typeof resolvedTab === "string" ? resolvedTab : resolvedTab?.id
  const isResPath = location.pathname === PATHS.RESERVATIONS

  return visibleReservationTabs.map((tab) => ({
    id: `reservations-${tab.id}`,
    label: tab.label,
    path: `${PATHS.RESERVATIONS}?tab=${tab.id}`,
    active:
      (isResPath && activeTab === tab.id) ||
      (tab.id === "calendar" &&
        (location.pathname === PATHS.CALENDAR || location.pathname === PATHS.BOOKING_CALENDAR)) ||
      (tab.id === "payments" && location.pathname === PATHS.RESERVATION_PAYMENTS) ||
      (tab.id === "guest-crm" && location.pathname === PATHS.CRM),
  }))
}

function buildFrontOfficeChildren({ role, isAdmin, privileges, location }) {
  const pathSlug = location.pathname.startsWith(`${PATHS.FRONT_OFFICE}/`)
    ? location.pathname.slice(`${PATHS.FRONT_OFFICE}/`.length).split('/')[0]
    : ''
  const querySlug = getSearchParam(location, 'tab')
  const activeSlug = normalizeFrontOfficeSlug(pathSlug || querySlug || 'room-rack')

  return FRONT_OFFICE_PAGES
    .filter((page) => isAdmin || role === 'SUPERUSER' || can(role, page.permission || 'dashboard', privileges))
    .sort((a, b) => a.order - b.order)
    .map((page) => ({
      id: `fo-${page.id}`,
      label: page.label,
      path: frontOfficePath(page.slug),
      active:
        (location.pathname === PATHS.FRONT_OFFICE || location.pathname.startsWith(`${PATHS.FRONT_OFFICE}/`)) &&
        activeSlug === page.slug,
    }))
}

function buildPosChildren(location) {
  return [
    {
      id: "restaurant",
      label: "Restaurant",
      path: PATHS.RESTAURANT || PATHS.POS || "/restaurant",
      active: isRestaurantRoute(location.pathname),
    },
    {
      id: "pos-print-center",
      label: "POS Print Center",
      path: PATHS.POS_PRINT_CENTER || "/pos/print-center",
      active: location.pathname.startsWith("/pos/print-center"),
    },
  ]
}

function buildAccountingChildren({ role, isAdmin, location }) {
  return SIDEBAR_ACCOUNTING_TABS.filter((tab) => !tab.adminOnly || isAdmin || role === "SUPERUSER").map((tab) => ({
    ...tab,
    active:
      tab.id === "vat"
        ? location.pathname === PATHS.VAT
        : tab.id === "vat-return"
          ? location.pathname === PATHS.VAT_RETURN
          : location.pathname === tab.path,
  }))
}

function buildHrChildren(location) {
  const findTab = (id) => SIDEBAR_HR_TABS.find((tab) => tab.id === id)
  const toChild = (tab) => ({
    id: tab.id,
    label: tab.label,
    path: tab.path,
    icon: tab.icon,
    active: location.pathname === tab.path,
  })

  const groups = [
    { id: "employee", label: "Employee", tabIds: ["employee-entry", "service-book", "nominee"] },
    { id: "attendance", label: "Attendance", tabIds: ["attendance-register", "employee-register", "service-book-reg"] },
    { id: "leave", label: "Leave", tabIds: ["leave-entry", "comp-leave", "festival-leave"] },
    { id: "payroll", label: "Payroll", tabIds: ["payroll-config", "payroll-gen", "payroll-register"] },
    {
      id: "letters",
      label: "Letters",
      tabIds: [
        "offer-letter",
        "appointment-letter",
        "joining-letter",
        "confirmation-letter",
        "increment-letter",
        "promotion-letter",
        "objection-letter",
        "show-cause",
        "warning-letter",
        "dismissal-letter",
        "noc",
        "experience-cert",
        "employment-cert",
        "final-payment",
      ],
    },
    { id: "compliance", label: "Compliance", tabIds: ["incidents", "compliance"] },
  ]

  return groups.map((group) => {
    const children = group.tabIds.map(findTab).filter(Boolean).map(toChild)
    return {
      id: group.id,
      label: group.label,
      active: children.some((child) => child.active),
      children,
    }
  })
}

function buildReportsChildren({ role, location }) {
  const catalog = getRoleDefaultReportCatalog(role) || []
  const pathParts = location.pathname.split("/").filter(Boolean)
  const activeDepartment = pathParts[1]
  const activeReportSlug = pathParts[2]
  const activeReportCode = getSearchParam(location, "report")

  const categories = REPORT_CATEGORIES.map((category) => {
    const reports = catalog.filter((report) => report.category === category.code)

    const children = reports.map((report) => {
      const departmentSlug = normalizeReportDepartment(report, category)
      const reportSlug = normalizeReportSlug(report)

      return {
        id: report.code || report.id || reportSlug,
        label: report.name || report.reportName || report.title || report.code,
        path: buildReportPath(report, category),
        active:
          (activeDepartment === departmentSlug && activeReportSlug === reportSlug) ||
          activeReportCode === report.code,
      }
    })

    return {
      id: category.code,
      label: category.name,
      icon: category.icon,
      active: children.some((child) => child.active),
      children,
    }
  }).filter((category) => category.children.length > 0)

  return categories
}

function buildTaskChildren(location) {
  const rawTab = getSearchParam(location, "tab") || "my"
  const taskTab = VALID_TASK_TABS.has(rawTab) ? rawTab : "my"
  const onTasksPath = location.pathname === PATHS.TASKS

  return [
    {
      id: "tasks-my",
      label: "My Tasks",
      path: `${PATHS.TASKS}?tab=my`,
      active: onTasksPath && taskTab === "my",
    },
    {
      id: "tasks-all",
      label: "All Tasks",
      path: `${PATHS.TASKS}?tab=all`,
      active: onTasksPath && taskTab === "all",
    },
    {
      id: "tasks-ai",
      label: "AI Tasker",
      path: `${PATHS.TASKS}?tab=ai`,
      active: (onTasksPath && taskTab === "ai") || location.pathname === PATHS.AI_TASKER,
    },
  ]
}

function buildNestedChildren(id, context) {
  switch (id) {
    case "settings":
      return buildSettingsChildren(context)

    case "master-data":
      return buildMasterDataChildren(context.location)

    case "reservations":
      return buildReservationChildren(context)

    case "nightaudit":
      return buildFrontOfficeChildren(context)

    case "pos":
      return buildPosChildren(context.location)

    case "inventory":
      return [{ id: "inventory", label: "Inventory", path: PATHS.INVENTORY || "/inventory", active: getTopSegment(context.location.pathname) === "inventory" }]

    case "accounting":
      return buildAccountingChildren(context)

    case "hr":
      return buildHrChildren(context.location)

    case "reports":
      return buildReportsChildren(context)

    case "tasks":
      return buildTaskChildren(context.location)

    default:
      return []
  }
}


export default function SidebarNavigation({
  role,
  isAdmin,
  privileges,
  modulesEnabled,
  onNavigate,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [manualSystemMenu, setManualSystemMenu] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const visibleReservationTabs = useMemo(
    () => getVisibleReservationTabs({ role, isAdmin, privileges }),
    [isAdmin, privileges, role]
  )

  const currentTopId = getCurrentTopId(location.pathname)
  const effectiveModulesEnabled = role === "SUPERUSER" ? null : modulesEnabled
  const routeSystemMenu = buildRouteSystemMenu({
    pathname: location.pathname,
    currentTopId,
  })
  const openSystemMenu = manualSystemMenu ?? routeSystemMenu

  const context = {
    role,
    isAdmin,
    privileges,
    modulesEnabled: effectiveModulesEnabled,
    visibleReservationTabs,
    location,
  }

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const goTo = (path) => {
    onNavigate?.()
    navigate(path)
  }

  const matchesSearch = (item, nested) => {
    if (!normalizedSearch) return true

    const moduleMatch = String(item.label || "")
      .toLowerCase()
      .includes(normalizedSearch)

    const childMatch = (nested || []).some((child) => {
      if (child.children) {
        return (
          String(child.label || "").toLowerCase().includes(normalizedSearch) ||
          child.children.some((nestedChild) =>
            String(nestedChild.label || "")
              .toLowerCase()
              .includes(normalizedSearch)
          )
        )
      }

      return String(child.label || "")
        .toLowerCase()
        .includes(normalizedSearch)
    })

    return moduleMatch || childMatch
  }

  return (
    <SidebarContent asChild>
      <nav className="aeds-v6-sidebar-nav px-3 pb-4 pt-2">
      <div className="aeds-v6-sidebar-search">
        <Search size={15} aria-hidden="true" />
        <SidebarInput
          className="h-8 border-white/15 bg-white/10 text-white placeholder:text-white/55"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Find module or page"
          aria-label="Search navigation"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear navigation search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {NAV_GROUPS.map((group, groupIndex) => {
        const preparedItems = group.items
          .filter((item) => isModuleVisible(item, context))
          .map((item) => ({
            item,
            nested: EXPANDABLE_MODULES.has(item.id)
              ? buildNestedChildren(item.id, context)
              : [],
          }))
          .filter(({ item, nested }) => matchesSearch(item, nested))

        if (preparedItems.length === 0) return null

        return (
          <section
            key={group.title}
            className={`aeds-v6-nav-group ${
              groupIndex > 0 ? "mt-3 border-t border-white/[0.08] pt-3" : ""
            }`}
          >
            <div className="aeds-v6-nav-group-title">{group.title}</div>

            <div className="space-y-1">
              {preparedItems.map(({ item, nested }) => {
                const expandable = EXPANDABLE_MODULES.has(item.id)
                const searchForcesOpen = Boolean(normalizedSearch && nested.length)
                const open =
                  searchForcesOpen ||
                  openSystemMenu === item.id
                const active =
                  currentTopId === item.id ||
                  routeSystemMenu === item.id

                if (!expandable) {
                  return (
                    <NavButton
                      key={item.id}
                      item={item}
                      active={active}
                      open={false}
                      expandable={false}
                      onClick={() => goTo(modulePathById(item.id))}
                    />
                  )
                }

                return (
                  <div key={item.id} className="space-y-1">
                    <NavButton
                      item={item}
                      active={active}
                      open={open}
                      expandable
                      onClick={() => {
                        setManualSystemMenu(open ? null : item.id)
                        if (!open && !normalizedSearch) {
                          goTo(modulePathById(item.id))
                        }
                      }}
                    />

                    {open && (
                      <div className="aeds-v6-nav-children ml-6 space-y-0.5">
                        {nested.map((child) =>
                          child.children ? (
                            <SubGroup
                              key={child.id}
                              group={child}
                              onNavigate={goTo}
                            />
                          ) : (
                            <ChildButton
                              key={child.id}
                              child={child}
                              onNavigate={goTo}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {normalizedSearch &&
        NAV_GROUPS.every((group) =>
          group.items
            .filter((item) => isModuleVisible(item, context))
            .every((item) => {
              const nested = EXPANDABLE_MODULES.has(item.id)
                ? buildNestedChildren(item.id, context)
                : []
              return !matchesSearch(item, nested)
            })
        ) && (
          <div className="aeds-v6-sidebar-empty">
            No matching module or page.
          </div>
        )}
      </nav>
    </SidebarContent>
  )
}
