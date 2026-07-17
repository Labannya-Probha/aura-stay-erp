/**
 * Branding utilities — theme building, CSS variable application,
 * and resolution from company_settings.
 * 
 * Supports dynamic tenant logo and color palette across all UI components.
 */

export const DEFAULT_THEME = {
  primary:      '#1F6F78',
  secondary:    '#EAF4F1',
  accent:       '#2E7D32',
  printPrimary: '#1B4D2E',
  printAccent:  '#2E7D32',
  sidebarBg:    '#123F2A',
  sidebarText:  '#FFFFFF',
  buttonColor:  '#1F6F78',
  tableHeader:  '#EAF4F1',
  reportHeader: '#0F4C81',
  fontFamily:   'Inter',
  themeMode:    'light',
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
    secondary:    config.secondary    || DEFAULT_THEME.secondary,
    accent:       config.accent       || DEFAULT_THEME.accent,
    printPrimary: config.printPrimary || DEFAULT_THEME.printPrimary,
    printAccent:  config.printAccent  || DEFAULT_THEME.printAccent,
    sidebarBg:    config.sidebarBg    || DEFAULT_THEME.sidebarBg,
    sidebarText:  config.sidebarText  || DEFAULT_THEME.sidebarText,
    buttonColor:  config.buttonColor  || config.primary || DEFAULT_THEME.buttonColor,
    tableHeader:  config.tableHeader  || DEFAULT_THEME.tableHeader,
    reportHeader: config.reportHeader || DEFAULT_THEME.reportHeader,
    fontFamily:   config.fontFamily   || DEFAULT_THEME.fontFamily,
    themeMode:    config.themeMode    || DEFAULT_THEME.themeMode,
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

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!result) return [31, 111, 120]
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}

function readableTextColor(hex) {
  const [r, g, b] = hexToRgb(hex)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 160 ? '#172033' : '#FFFFFF'
}

function mixHex(hex, target = '#ffffff', weight = 0.88) {
  const [r, g, b] = hexToRgb(hex)
  const [tr, tg, tb] = hexToRgb(target)
  return rgbToHex(
    Math.round(r * (1 - weight) + tr * weight),
    Math.round(g * (1 - weight) + tg * weight),
    Math.round(b * (1 - weight) + tb * weight),
  )
}

function luminance([r, g, b]) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function saturation([r, g, b]) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

const logoPaletteCache = new Map()

async function extractLogoPalette(logoUrl) {
  if (!logoUrl || typeof window === 'undefined') return null
  if (logoPaletteCache.has(logoUrl)) return logoPaletteCache.get(logoUrl)

  const promise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 48
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, size, size)
        const pixels = ctx.getImageData(0, 0, size, size).data
        const buckets = new Map()

        for (let i = 0; i < pixels.length; i += 4) {
          const alpha = pixels[i + 3]
          if (alpha < 160) continue
          const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]]
          const lum = luminance(rgb)
          const sat = saturation(rgb)
          if (lum > 0.94 || lum < 0.06 || sat < 0.12) continue
          const key = rgb.map((v) => Math.round(v / 24) * 24).join(',')
          const current = buckets.get(key) || { rgb: key.split(',').map(Number), count: 0, score: 0 }
          current.count += 1
          current.score += sat * 2 + (1 - Math.abs(lum - 0.45))
          buckets.set(key, current)
        }

        const colors = [...buckets.values()]
          .map((item) => ({ ...item, rank: item.count * item.score }))
          .sort((a, b) => b.rank - a.rank)

        if (!colors.length) return resolve(null)
        const primary = rgbToHex(...colors[0].rgb)
        const accent = rgbToHex(...(colors.find((c) => Math.abs(luminance(c.rgb) - luminance(colors[0].rgb)) > 0.12) || colors[1] || colors[0]).rgb)
        const dark = mixHex(primary, '#000000', 0.34)
        resolve({
          primary,
          accent,
          printPrimary: dark,
          printAccent: accent,
          sidebarBg: dark,
          buttonColor: primary,
          tableHeader: mixHex(primary, '#ffffff', 0.88),
          reportHeader: dark,
          secondary: mixHex(primary, '#ffffff', 0.92),
        })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = logoUrl
  })

  logoPaletteCache.set(logoUrl, promise)
  return promise
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
  const secondaryRgb = hexToRgbChannels(theme.secondary)
  const accentRgb = hexToRgbChannels(theme.accent)
  const darkRgb = hexToRgbChannels(theme.printPrimary)
  const buttonRgb = hexToRgbChannels(theme.buttonColor)
  
  // Set CSS custom properties
  root.style.setProperty('--tenant-primary', theme.primary)
  root.style.setProperty('--tenant-primary-rgb', primaryRgb)
  root.style.setProperty('--tenant-secondary', theme.secondary)
  root.style.setProperty('--tenant-secondary-rgb', secondaryRgb)
  root.style.setProperty('--tenant-accent', theme.accent)
  root.style.setProperty('--tenant-accent-rgb', accentRgb)
  root.style.setProperty('--tenant-dark', theme.printPrimary)
  root.style.setProperty('--tenant-dark-rgb', darkRgb)
  root.style.setProperty('--tenant-button', theme.buttonColor)
  root.style.setProperty('--tenant-button-rgb', buttonRgb)
  root.style.setProperty('--tenant-button-foreground', readableTextColor(theme.buttonColor))
  root.style.setProperty('--tenant-primary-foreground', readableTextColor(theme.primary))
  root.style.setProperty('--tenant-font-family', `"${theme.fontFamily}", "Inter", sans-serif`)
  root.style.setProperty('--tenant-text', '#172033')
  root.style.setProperty('--tenant-text-muted', '#64748B')
  root.style.setProperty('--tenant-surface', '#FFFFFF')
  root.style.setProperty('--tenant-surface-muted', '#F8FAFC')
  root.style.setProperty('--tenant-shell-bg', '#F1F5F9')
  root.style.setProperty('--tenant-border', 'rgb(148 163 184 / 0.28)')

  // Keep legacy semantic colours stable. Tenant branding is applied through
  // --tenant-* variables only, preventing every legacy card/badge from being
  // filled with the tenant primary colour.
  root.style.setProperty('--color-amber-rgb', '212 160 23')
  
  // Legacy properties for backward compatibility
  root.style.setProperty('--brand-color', theme.primary)
  root.style.setProperty('--brand-accent', theme.accent)
  root.style.setProperty('--brand-print-primary', theme.printPrimary)
  root.style.setProperty('--brand-print-accent', theme.printAccent)
  root.style.setProperty('--sidebar-bg', theme.sidebarBg)
  root.style.setProperty('--sidebar-text', theme.sidebarText)
  root.style.setProperty('--button-bg', theme.buttonColor)
  root.style.setProperty('--table-header-bg', theme.tableHeader)
  root.style.setProperty('--report-header-bg', theme.reportHeader)
  root.dataset.themeMode = theme.themeMode
  root.classList.toggle('tenant-dark', theme.themeMode === 'dark')
}

/**
 * Resolve the brand theme from a company_settings record.
 * Returns a promise so the caller can await it consistently.
 *
 * @param {object|null} company  Row from company_settings (may be null)
 * @returns {Promise<{ primary: string, accent: string, printPrimary: string, printAccent: string }>}
 */
export async function resolveBrandTheme(company) {
  const logoPalette = await extractLogoPalette(company?.logo_url)
  const fallback = logoPalette || DEFAULT_THEME
  return buildBrandTheme({
    primary:      company?.primary_color  || fallback.primary,
    secondary:    company?.secondary_color || fallback.secondary,
    accent:       company?.accent_color   || fallback.accent,
    printPrimary: company?.brand_primary  || fallback.printPrimary,
    printAccent:  company?.brand_accent   || fallback.printAccent,
    sidebarBg:    company?.sidebar_bg_color || company?.brand_primary || fallback.sidebarBg,
    sidebarText:  company?.sidebar_text_color || DEFAULT_THEME.sidebarText,
    buttonColor:  company?.button_color || company?.primary_color || fallback.buttonColor,
    tableHeader:  company?.table_header_color || fallback.tableHeader,
    reportHeader: company?.report_header_color || company?.brand_primary || fallback.reportHeader,
    fontFamily:   company?.font_family || DEFAULT_THEME.fontFamily,
    themeMode:    company?.theme_mode || DEFAULT_THEME.themeMode,
  })
}
