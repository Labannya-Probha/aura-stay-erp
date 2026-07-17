// src/lib/govtHolidays.js
// ────────────────────────────────────────────────────────────────────────────
// Bangladesh government public holiday calendar — used to visually mark
// govt. holidays on the Booking Calendar (in addition to the Fri/Sat weekend
// shading that already exists there).
//
// Source: Ministry of Public Administration (Jonoproshashon Montronaloy)
// 2026 holiday gazette, cross-checked against news coverage as of the time
// this list was compiled (Jul 2026). Islamic-calendar dates (Shab-e-Barat,
// Laylat al-Qadr, Eid-ul-Fitr, Eid-ul-Azha, Ashura, Eid-e-Milad-un-Nabi) are
// moon-sighting dependent and may shift by a day — verify close to the date.
// ────────────────────────────────────────────────────────────────────────────

export const GOVT_HOLIDAYS_2026 = {
  '2026-02-04': 'Shab-e-Barat',
  '2026-02-21': 'Shaheed Day (Int’l Mother Language Day)',
  '2026-03-18': 'Laylat al-Qadr',
  '2026-03-19': 'Eid-ul-Fitr Holiday',
  '2026-03-20': 'Jumatul Bidah / Eid-ul-Fitr Holiday',
  '2026-03-21': 'Eid-ul-Fitr',
  '2026-03-22': 'Eid-ul-Fitr Holiday',
  '2026-03-23': 'Eid-ul-Fitr Holiday',
  '2026-03-26': 'Independence Day',
  '2026-04-14': 'Pohela Boishakh (Bengali New Year)',
  '2026-05-01': 'May Day & Buddha Purnima',
  '2026-05-25': 'Eid-ul-Azha Holiday',
  '2026-05-26': 'Eid-ul-Azha Holiday',
  '2026-05-27': 'Eid-ul-Azha',
  '2026-05-28': 'Eid-ul-Azha Holiday',
  '2026-05-29': 'Eid-ul-Azha Holiday',
  '2026-05-30': 'Eid-ul-Azha Holiday',
  '2026-06-26': 'Ashura',
  '2026-08-05': 'July Uprising Day',
  '2026-08-25': 'Eid-e-Milad-un-Nabi',
  '2026-09-04': 'Janmashtami',
  '2026-10-20': 'Durga Puja Holiday',
  '2026-10-21': 'Vijaya Dashami',
  '2026-12-16': 'Victory Day',
  '2026-12-25': 'Christmas Day',
}

// Keyed by year so future years can be appended without touching call sites.
const ALL_YEARS = {
  2026: GOVT_HOLIDAYS_2026,
}

/** Returns the holiday name for a 'YYYY-MM-DD' date string, or null. */
export function getGovtHoliday(dateStr) {
  const year = Number(String(dateStr).slice(0, 4))
  const table = ALL_YEARS[year]
  return table?.[dateStr] || null
}

export function isGovtHoliday(dateStr) {
  return Boolean(getGovtHoliday(dateStr))
}
