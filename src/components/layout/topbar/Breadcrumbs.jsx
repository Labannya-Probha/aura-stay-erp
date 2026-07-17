import { useLocation } from "react-router-dom"
import { NAV_GROUPS } from "../../../app/navigation/navGroups"

const NAV_MAP = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item.label]))
)

const EXTRA_MAP = {
  "": "Dashboard",
  dashboard: "Dashboard",
  frontoffice: "Front Office",
  "front-office": "Front Office",
  nightaudit: "Front Office",
  reservations: "Reservations",
  restaurant: "Restaurant",
  pos: "Restaurant",
  inventory: "Inventory",
  accounting: "Accounting",
  vat: "Accounting",
  hr: "HR & Payroll",
  reports: "Reports",
  settings: "Settings",
  cms: "Master Data",
  "master-data": "Master Data",
  tasks: "Tasks",
}

function getModuleLabel(pathname) {
  const seg = pathname.split("/").filter(Boolean)[0] || "dashboard"
  return NAV_MAP[seg] || EXTRA_MAP[seg] || "Dashboard"
}

export default function Breadcrumbs({ company }) {
  const location = useLocation()
  const moduleLabel = getModuleLabel(location.pathname)

  return (
    <nav className="flex min-w-0 items-center gap-2 text-sm" aria-label="Breadcrumb">
      <span className="truncate font-black text-slate-800">{moduleLabel}</span>
      {company?.name && (
        <>
          <span className="text-slate-300">/</span>
          <span className="hidden max-w-[260px] truncate font-semibold text-slate-400 xl:block">
            {company.name}
          </span>
        </>
      )}
    </nav>
  )
}
