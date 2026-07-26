export const DEFAULT_FRONT_OFFICE_TAB = "arrival-board"

export const FRONT_OFFICE_TABS = [
  { id: "arrival-board", label: "Arrival Board", permission: "dashboard" },
  { id: "departure-board", label: "Departure Board", permission: "dashboard" },
  { id: "in-house", label: "In-House Guests", permission: "dashboard" },
  { id: "room-rack", label: "Room Rack", permission: "dashboard" },
  { id: "guest-folio", label: "Guest Folio", permission: "dashboard" },
  { id: "cashier", label: "Cashier", permission: "dashboard" },
  { id: "night-audit", label: "Night Audit", permission: "nightaudit" },
  { id: "lost-found", label: "Lost & Found", permission: "facilities" },
  { id: "guest-messages", label: "Guest Messages", permission: "dashboard" },
]

export const FRONT_OFFICE_LEGACY_TAB_REDIRECTS = {
  dashboard: "arrival-board",
  frontoffice: "arrival-board",
  nightaudit: "night-audit",
  facilities: "lost-found",
}

export function resolveFrontOfficeTab(tab) {
  if (!tab) return DEFAULT_FRONT_OFFICE_TAB
  return FRONT_OFFICE_TABS.some((item) => item.id === tab) ? tab : DEFAULT_FRONT_OFFICE_TAB
}
