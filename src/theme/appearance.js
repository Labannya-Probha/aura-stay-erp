const STORAGE_KEY = 'aeds-theme-mode'
const THEME_MODES = ['system', 'light', 'dark']

export function resolveThemeMode(mode, systemPreference = 'light') {
  if (mode === 'light' || mode === 'dark') return mode
  return systemPreference === 'dark' ? 'dark' : 'light'
}

export function getStoredThemeMode(value) {
  if (typeof value !== 'string') return 'system'
  const normalized = value.trim().toLowerCase()
  return THEME_MODES.includes(normalized) ? normalized : 'system'
}

export function persistThemeMode(mode) {
  const normalized = getStoredThemeMode(mode)
  if (typeof window === 'undefined') return normalized
  window.localStorage.setItem(STORAGE_KEY, normalized)
  return normalized
}

export function readStoredThemeMode() {
  if (typeof window === 'undefined') return 'system'
  return getStoredThemeMode(window.localStorage.getItem(STORAGE_KEY))
}

export function getThemeModePreference(mode, systemPreference = 'light') {
  return resolveThemeMode(mode, systemPreference)
}
