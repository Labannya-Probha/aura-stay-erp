export const FRONT_OFFICE_TABS = [
  {
    id: "room-rack",
    label: "Room Rack",
    icon: "BedDouble",
    permission: "front_office",
    default: true,
  },
  {
    id: "arrival-board",
    label: "Arrivals",
    icon: "LogIn",
    permission: "front_office",
  },
  {
    id: "departure-board",
    label: "Departures",
    icon: "LogOut",
    permission: "front_office",
  },
  {
    id: "in-house",
    label: "In-House Guests",
    icon: "Users",
    permission: "front_office",
  },
  {
    id: "check-in-out",
    label: "Check In / Check Out",
    icon: "ClipboardCheck",
    permission: "front_office",
  },
  {
    id: "guest-folio",
    label: "Guest Folios",
    icon: "ReceiptText",
    permission: "front_office",
  },
  {
    id: "cashier",
    label: "Cashier",
    icon: "WalletCards",
    permission: "front_office",
  },
  {
    id: "night-audit",
    label: "Night Audit",
    icon: "MoonStar",
    permission: "front_office",
  },
  {
    id: "lost-found",
    label: "Lost & Found",
    icon: "SearchCheck",
    permission: "front_office",
  },
  {
    id: "guest-messages",
    label: "Guest Messages",
    icon: "MessageSquareText",
    permission: "front_office",
  },
]

export const DEFAULT_FRONT_OFFICE_TAB = "room-rack"

export function resolveFrontOfficeTab(
  id = DEFAULT_FRONT_OFFICE_TAB,
  visibleTabs = FRONT_OFFICE_TABS
) {
  return (
    visibleTabs.find((tab) => tab.id === id) ||
    visibleTabs.find((tab) => tab.default) ||
    visibleTabs[0]
  )
}
export const FRONT_OFFICE_LEGACY_TAB_REDIRECTS = {
  "room-board": "room-rack",
  "room-rack": "room-rack",
  "arrival-board": "arrival-board",
  "arrivals": "arrival-board",
  "departure-board": "departure-board",
  "departures": "departure-board",
  "in-house-guests": "in-house",
  "in-house": "in-house",
  "guest-folio": "guest-folio",
  "guest-folios": "guest-folio",
  "cashier": "cashier",
  "night-audit": "night-audit",
  "lost-found": "lost-found",
  "guest-messages": "guest-messages",
}