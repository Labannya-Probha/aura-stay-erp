export const RESERVATION_TABS = [
  { id: "calendar", label: "Booking Calendar", icon: "Calendar", permission: "reservations", default: true },
  { id: "list", label: "Reservations", icon: "List", permission: "reservations" },
  { id: "availability", label: "Availability", icon: "Bed", permission: "reservations" },
  { id: "new", label: "New Reservation", icon: "Plus", permission: "reservations" },
  { id: "payments", label: "Payments", icon: "CreditCard", permission: "reservations" },
  { id: "guest-crm", label: "Guest CRM", icon: "Users", permission: "reservations" },
  { id: "quotations", label: "Quotations", icon: "FileText", permission: "reservations" },
  { id: "history", label: "History", icon: "History", permission: "reservations" },
  { id: "reports", label: "Reports", icon: "BarChart3", permission: "reports" },
]
export const DEFAULT_RESERVATION_TAB = "calendar"
export function getVisibleReservationTabs({ role, isAdmin, privileges } = {}) {
  if (isAdmin || role === "SUPERUSER") return RESERVATION_TABS

  const allowed = new Set(
    (privileges || [])
      .filter((item) => item.can_view)
      .map((item) => item.module)
  )

  const visible = RESERVATION_TABS.filter((tab) => {
    if (!tab.permission) return true
    return allowed.has(tab.permission) || allowed.has("reservations")
  })

  return visible.length > 0 ? visible : RESERVATION_TABS.filter((tab) => tab.id === "calendar")
}

export function resolveReservationTab(
  id = DEFAULT_RESERVATION_TAB,
  visibleTabs = RESERVATION_TABS
) {
  return (
    visibleTabs.find((tab) => tab.id === id) ||
    visibleTabs.find((tab) => tab.default) ||
    visibleTabs[0]
  )
}
