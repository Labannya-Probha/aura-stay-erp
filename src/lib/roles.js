export const ROLES = ['ADMIN', 'MANAGER', 'FRONT_OFFICE', 'RESTAURANT', 'STORE', 'ACCOUNTS', 'HR']
export const ROLE_LABELS = {
  ADMIN: 'Administrator', MANAGER: 'Manager', FRONT_OFFICE: 'Front Office',
  RESTAURANT: 'Restaurant', STORE: 'Store', ACCOUNTS: 'Accounts', HR: 'HR & Admin',
}

// Which roles can open which module. ADMIN always passes.
export const NAV_ACCESS = {
  dashboard: ['ADMIN', 'MANAGER', 'FRONT_OFFICE', 'RESTAURANT', 'STORE', 'ACCOUNTS', 'HR'],
  reservations: ['ADMIN', 'MANAGER', 'FRONT_OFFICE'],
  calendar: ['ADMIN', 'MANAGER', 'FRONT_OFFICE'],
  nightaudit: ['ADMIN', 'MANAGER', 'FRONT_OFFICE'],
  pos: ['ADMIN', 'MANAGER', 'RESTAURANT', 'FRONT_OFFICE'],
  facilities: ['ADMIN', 'MANAGER', 'FRONT_OFFICE', 'RESTAURANT'],
  housekeeping: ['ADMIN', 'MANAGER', 'FRONT_OFFICE'],
  inventory: ['ADMIN', 'MANAGER', 'STORE'],
  vat: ['ADMIN', 'MANAGER', 'ACCOUNTS', 'FRONT_OFFICE'],
  accounting: ['ADMIN', 'MANAGER', 'ACCOUNTS', 'FRONT_OFFICE'],
  hr: ['ADMIN', 'MANAGER', 'HR', 'FRONT_OFFICE'],
  reports: ['ADMIN', 'MANAGER', 'ACCOUNTS', 'FRONT_OFFICE'],
  settings: ['ADMIN', 'MANAGER', 'FRONT_OFFICE'],
}

export const can = (role, pageId) =>
  role === 'ADMIN' || (NAV_ACCESS[pageId] || []).includes(role)
