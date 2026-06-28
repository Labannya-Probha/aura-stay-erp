/**
 * Branding utilities — theme building, CSS variable application,
 * and resolution from company_settings.
 * 
 * Supports dynamic tenant color palette across all UI components.
 */

export const DEFAULT_THEME = {
  primary:      '#1F6F78',
  accent:       '#2E7D32',
  printPrimary: '#1B4D2E',
  printAccent:  '#2E7D32',
}

/**
 * Build a normalised theme object from a raw config.
 * Falls back to DEFAULT_THEME for any missing value.
 *
 * @param {object} config
 * @returns {{ primary: string, accent: string, printPrimary: string, printAccent: string }}
 */
export function buildBrandTheme(config = {}) {
  return {
    primary:      config.primary      || DEFAULT_THEME.primary,
    accent:       config.accent       || DEFAULT_THEME.accent,
    printPrimary: config.printPrimary || DEFAULT_THEME.printPrimary,
    printAccent:  config.printAccent  || DEFAULT_THEME.printAccent,
  }
}

/**
 * Convert hex color to RGB channels (no commas)
 * @param {string} hex - Hex color value (e.g., "#1F6F78")
 * @returns {string} RGB channels (e.g., "31 111 120")
 */
function hexToRgbChannels(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '31 111 120' // fallback to default
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ].join(' ')
}

/**
 * Apply a theme object to the document root as CSS custom properties.
 * Updates both static color names and dynamic RGB channels for alpha transparency.
 *
 * @param {{ primary: string, accent: string, printPrimary: string, printAccent: string }} theme
 */
export function applyBrandTheme(theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  
  // Primary color and its RGB channels
  const primaryRgb = hexToRgbChannels(theme.primary)
  const accentRgb = hexToRgbChannels(theme.accent)
  const darkRgb = hexToRgbChannels(theme.printPrimary)
  
  // Set CSS custom properties
  root.style.setProperty('--tenant-primary', theme.primary)
  root.style.setProperty('--tenant-primary-rgb', primaryRgb)
  root.style.setProperty('--tenant-accent', theme.accent)
  root.style.setProperty('--tenant-accent-rgb', accentRgb)
  root.style.setProperty('--tenant-dark', theme.printPrimary)
  root.style.setProperty('--tenant-dark-rgb', darkRgb)
  
  // Legacy properties for backward compatibility
  root.style.setProperty('--brand-color', theme.primary)
  root.style.setProperty('--brand-accent', theme.accent)
  root.style.setProperty('--brand-print-primary', theme.printPrimary)
  root.style.setProperty('--brand-print-accent', theme.printAccent)
  root.style.setProperty('--sidebar-bg', theme.printPrimary)
}

/**
 * Resolve the brand theme from a company_settings record.
 * Returns a promise so the caller can await it consistently.
 *
 * @param {object|null} company  Row from company_settings (may be null)
 * @returns {Promise<{ primary: string, accent: string, printPrimary: string, printAccent: string }>}
 */
export async function resolveBrandTheme(company) {
  return buildBrandTheme({
    primary:      company?.primary_color  || DEFAULT_THEME.primary,
    accent:       company?.accent_color   || DEFAULT_THEME.accent,
    printPrimary: company?.brand_primary  || DEFAULT_THEME.printPrimary,
    printAccent:  company?.brand_accent   || DEFAULT_THEME.printAccent,
  })
}
