/* ------------------------------------------------------------------ */
/*  FRONT OFFICE MODULE CONFIG                                          */
/* ------------------------------------------------------------------ */

export const FRONT_OFFICE_TABS = [
  { id: 'in-house',       label: 'In-House Guests', permission: 'dashboard' },
  { id: 'room-board',     label: 'Room Board', permission: 'dashboard' },
  { id: 'check-in-out',   label: 'Check In / Check Out', permission: 'dashboard' },
  { id: 'guest-folio',    label: 'Guest Folio', permission: 'dashboard' },
  { id: 'service-bills',  label: 'Service Bills', permission: 'facilities' },
  { id: 'night-audit',    label: 'Night Audit', permission: 'nightaudit' },
  { id: 'lost-found',     label: 'Lost & Found', permission: 'dashboard' },
  { id: 'guest-messages', label: 'Guest Messages', permission: 'dashboard' },
]

export const DEFAULT_FRONT_OFFICE_TAB = 'in-house'

export const FRONT_OFFICE_LEGACY_TAB_REDIRECTS = {
  dashboard: DEFAULT_FRONT_OFFICE_TAB,
  frontoffice: DEFAULT_FRONT_OFFICE_TAB,
  nightaudit: 'night-audit',
  facilities: 'service-bills',
}
