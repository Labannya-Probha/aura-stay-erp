import {
  BedDouble,
  LogIn,
  LogOut,
  Users,
  ClipboardCheck,
  ReceiptText,
  WalletCards,
  MoonStar,
  SearchCheck,
  MessageSquareText,
  ConciergeBell,
} from 'lucide-react'

export const DEFAULT_FRONT_OFFICE_PAGE = 'room-rack'

/**
 * Single source of truth for Front Office routing, sidebar navigation,
 * page titles, permissions and rendering keys.
 */
export const FRONT_OFFICE_PAGES = [
  {
    id: 'room-rack',
    slug: 'room-rack',
    label: 'Room Rack',
    title: 'Room Rack',
    description: 'Live room status, occupancy, housekeeping and guest balances.',
    icon: BedDouble,
    permission: 'frontoffice',
    renderer: 'room-rack',
    showWorkspace: true,
    order: 10,
  },
  {
    id: 'arrivals',
    slug: 'arrivals',
    label: 'Arrivals',
    title: 'Arrivals',
    description: 'Today’s expected arrivals and check-in readiness.',
    icon: LogIn,
    permission: 'frontoffice',
    renderer: 'arrivals',
    order: 20,
  },
  {
    id: 'departures',
    slug: 'departures',
    label: 'Departures',
    title: 'Departures',
    description: 'Today’s expected departures and checkout status.',
    icon: LogOut,
    permission: 'frontoffice',
    renderer: 'departures',
    order: 30,
  },
  {
    id: 'in-house',
    slug: 'in-house',
    label: 'In-House Guests',
    title: 'In-House Guests',
    description: 'Current stays, room assignments and guest service actions.',
    icon: Users,
    permission: 'frontoffice',
    renderer: 'in-house',
    order: 40,
  },
  {
    id: 'check-in-out',
    slug: 'check-in-out',
    label: 'Check In / Check Out',
    title: 'Check In / Check Out',
    description: 'Operational queue for guest arrivals and departures.',
    icon: ClipboardCheck,
    permission: 'frontoffice',
    renderer: 'check-in-out',
    order: 50,
  },
  {
    id: 'guest-folio',
    slug: 'guest-folio',
    label: 'Guest Folios',
    title: 'Guest Folios',
    description: 'Review charges, payments, deposits and folio balances.',
    icon: ReceiptText,
    permission: 'frontoffice',
    renderer: 'guest-folio',
    order: 60,
  },
  {
    id: 'service-bills',
    slug: 'service-bills',
    label: 'Service Bills',
    title: 'Service Bills',
    description: 'Create and settle guest service and facility charges.',
    icon: ConciergeBell,
    permission: 'facilities',
    renderer: 'service-bills',
    order: 70,
  },
  {
    id: 'cashier',
    slug: 'cashier',
    label: 'Cashier',
    title: 'Cashier',
    description: 'Receive payments, manage deposits and close cashier activity.',
    icon: WalletCards,
    permission: 'frontoffice',
    renderer: 'cashier',
    order: 80,
  },
  {
    id: 'night-audit',
    slug: 'night-audit',
    label: 'Night Audit',
    title: 'Night Audit',
    description: 'Validate operations, post daily activity and close the business date.',
    icon: MoonStar,
    permission: 'nightaudit',
    renderer: 'night-audit',
    order: 90,
  },
  {
    id: 'lost-found',
    slug: 'lost-found',
    label: 'Lost & Found',
    title: 'Lost & Found',
    description: 'Register, track and return lost or found items.',
    icon: SearchCheck,
    permission: 'frontoffice',
    renderer: 'lost-found',
    order: 100,
  },
  {
    id: 'guest-messages',
    slug: 'guest-messages',
    label: 'Guest Messages',
    title: 'Guest Messages',
    description: 'Record, assign and follow up guest messages and requests.',
    icon: MessageSquareText,
    permission: 'dashboard',
    renderer: 'guest-messages',
    order: 110,
  },
]

export const FRONT_OFFICE_LEGACY_SLUGS = {
  frontoffice: DEFAULT_FRONT_OFFICE_PAGE,
  'room-board': 'room-rack',
  'arrival-board': 'arrivals',
  arrivals: 'arrivals',
  'departure-board': 'departures',
  departures: 'departures',
  'in-house-guests': 'in-house',
  'in-house': 'in-house',
  'check-in': 'check-in-out',
  'check-out': 'check-in-out',
  'guest-folios': 'guest-folio',
  facilities: 'service-bills',
  nightaudit: 'night-audit',
}

// Backward compatibility for older imports.
export const FRONT_OFFICE_TABS = FRONT_OFFICE_PAGES
export const DEFAULT_FRONT_OFFICE_TAB = DEFAULT_FRONT_OFFICE_PAGE
export const FRONT_OFFICE_LEGACY_TAB_REDIRECTS = FRONT_OFFICE_LEGACY_SLUGS

export function normalizeFrontOfficeSlug(value) {
  const raw = String(value || '').trim().toLowerCase()
  const normalized = FRONT_OFFICE_LEGACY_SLUGS[raw] || raw || DEFAULT_FRONT_OFFICE_PAGE
  return FRONT_OFFICE_PAGES.some((page) => page.slug === normalized)
    ? normalized
    : DEFAULT_FRONT_OFFICE_PAGE
}

export function getFrontOfficePage(value) {
  const slug = normalizeFrontOfficeSlug(value)
  return FRONT_OFFICE_PAGES.find((page) => page.slug === slug) || FRONT_OFFICE_PAGES[0]
}

export function resolveFrontOfficeTab(value) {
  return getFrontOfficePage(value)
}

export function frontOfficePath(slug = DEFAULT_FRONT_OFFICE_PAGE) {
  return `/front-office/${normalizeFrontOfficeSlug(slug)}`
}
