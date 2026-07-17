import { AEDS_DEFAULT_THEME } from "./tokens"
import { darken, getReadableText, hexToRgb, lighten, mix, normalizeHex } from "./color.utils"

const SEEDED_BRAND_DEFAULTS = {
  primary: "#1F6F78",
  accent: "#2E7D32",
  brandPrimary: "#1B4D2E",
  sidebarBg: "#123F2A",
  reportHeader: "#0F4C81",
  secondary: "#EAF4F1",
}

function safeColor(value, fallback) {
  return normalizeHex(value) || fallback
}

function safeTextColor(value, fallback) {
  const text = typeof value === "string" ? value.trim() : ""
  return text || fallback
}

function preferTenantColor(value, paletteValue, seededDefault) {
  const normalized = safeColor(value, null)
  if (!normalized) return safeColor(paletteValue, null)
  if (safeColor(paletteValue, null) && normalized === seededDefault) return safeColor(paletteValue, null)
  return normalized
}

export function buildTenantTheme(company = {}, logoPalette = null) {
  const safeCompany = company || {}
  const palette = logoPalette || {}

  const primary =
    safeColor(safeCompany.theme_color, null) ||
    preferTenantColor(safeCompany.primary_color, palette.primary, SEEDED_BRAND_DEFAULTS.primary) ||
    safeColor(safeCompany.brand_color, null) ||
    preferTenantColor(safeCompany.brand_primary, palette.primary, SEEDED_BRAND_DEFAULTS.brandPrimary) ||
    safeColor(safeCompany.themeColor, null) ||
    safeColor(palette.primary, null) ||
    AEDS_DEFAULT_THEME.primary

  const secondary =
    preferTenantColor(safeCompany.secondary_color, palette.secondary || mix(primary, "#FFFFFF", 0.22), SEEDED_BRAND_DEFAULTS.secondary) ||
    safeColor(safeCompany.theme_secondary, null) ||
    safeColor(safeCompany.secondaryColor, null) ||
    safeColor(palette.secondary, null) ||
    mix(primary, "#FFFFFF", 0.22)

  const accent =
    preferTenantColor(safeCompany.accent_color, palette.accent, SEEDED_BRAND_DEFAULTS.accent) ||
    preferTenantColor(safeCompany.brand_accent, palette.accent, SEEDED_BRAND_DEFAULTS.accent) ||
    safeColor(safeCompany.theme_accent, null) ||
    safeColor(safeCompany.accentColor, null) ||
    safeColor(palette.accent, null) ||
    mix(primary, "#22C55E", 0.38)

  const primaryDark = darken(primary, 0.34)
  const sidebarBg =
    preferTenantColor(safeCompany.sidebar_bg_color, darken(primary, 0.34), SEEDED_BRAND_DEFAULTS.sidebarBg) ||
    preferTenantColor(safeCompany.brand_primary, darken(primary, 0.34), SEEDED_BRAND_DEFAULTS.brandPrimary) ||
    primaryDark

  const buttonColor =
    preferTenantColor(safeCompany.button_color, primary, SEEDED_BRAND_DEFAULTS.primary) ||
    preferTenantColor(safeCompany.primary_color, primary, SEEDED_BRAND_DEFAULTS.primary) ||
    preferTenantColor(safeCompany.brand_primary, primary, SEEDED_BRAND_DEFAULTS.brandPrimary) ||
    primary

  const reportHeader =
    preferTenantColor(safeCompany.report_header_color, primaryDark, SEEDED_BRAND_DEFAULTS.reportHeader) ||
    preferTenantColor(safeCompany.brand_primary, primaryDark, SEEDED_BRAND_DEFAULTS.brandPrimary) ||
    primaryDark

  const tableHeader =
    preferTenantColor(safeCompany.table_header_color, mix(primary, "#FFFFFF", 0.9), SEEDED_BRAND_DEFAULTS.secondary) ||
    secondary

  const fontFamily = safeTextColor(safeCompany.font_family, null)

  return {
    ...AEDS_DEFAULT_THEME,
    name: safeCompany.software_name || safeCompany.name || safeCompany.tenant_name || AEDS_DEFAULT_THEME.name,
    primary,
    primaryDark,
    primarySoft: lighten(primary, 0.90),
    secondary,
    accent,
    shellBg: mix(lighten(primary, 0.92), "#F8FAFC", 0.55),
    border: mix(primary, "#E2E8F0", 0.88),
    buttonColor,
    buttonText: getReadableText(buttonColor),
    sidebarBg,
    sidebarText: safeTextColor(safeCompany.sidebar_text_color, getReadableText(sidebarBg)),
    tableHeader,
    reportHeader,
    printPrimary: safeColor(safeCompany.brand_primary, null) || primaryDark,
    printAccent: safeColor(safeCompany.brand_accent, null) || accent,
    fontBody: fontFamily || AEDS_DEFAULT_THEME.fontBody,
    fontDisplay: fontFamily || AEDS_DEFAULT_THEME.fontDisplay,
    fontFamily: fontFamily || AEDS_DEFAULT_THEME.fontBody,
    themeMode: safeCompany.theme_mode || AEDS_DEFAULT_THEME.mode,
    source: palette.source || "company",
  }
}

export function themeToCssVars(theme = AEDS_DEFAULT_THEME) {
  const primaryRgb = hexToRgb(theme.primary) || { r: 31, g: 111, b: 120 }
  const secondaryRgb = hexToRgb(theme.secondary) || { r: 234, g: 244, b: 241 }
  const accentRgb = hexToRgb(theme.accent) || { r: 46, g: 125, b: 50 }
  const darkRgb = hexToRgb(theme.sidebarBg || theme.primaryDark || darken(theme.primary, 0.34)) || { r: 27, g: 77, b: 46 }
  const buttonRgb = hexToRgb(theme.buttonColor || theme.primary) || primaryRgb

  return {
    "--tenant-name": `"${theme.name}"`,
    "--tenant-primary": theme.primary,
    "--tenant-primary-rgb": `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`,
    "--tenant-primary-dark": theme.primaryDark,
    "--tenant-primary-soft": theme.primarySoft,
    "--tenant-secondary": theme.secondary,
    "--tenant-secondary-rgb": `${secondaryRgb.r} ${secondaryRgb.g} ${secondaryRgb.b}`,
    "--tenant-accent": theme.accent,
    "--tenant-accent-rgb": `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`,
    "--tenant-dark": theme.sidebarBg || theme.primaryDark,
    "--tenant-dark-rgb": `${darkRgb.r} ${darkRgb.g} ${darkRgb.b}`,
    "--tenant-surface": theme.surface,
    "--tenant-surface-muted": theme.surfaceMuted,
    "--tenant-shell-bg": theme.shellBg,
    "--tenant-text": theme.text,
    "--tenant-text-muted": theme.textMuted,
    "--tenant-border": theme.border,
    "--tenant-danger": theme.danger,
    "--tenant-warning": theme.warning,
    "--tenant-success": theme.success,
    "--tenant-info": theme.info,
    "--aeds-radius-sm": theme.radiusSm,
    "--aeds-radius-md": theme.radiusMd,
    "--aeds-radius-lg": theme.radiusLg,
    "--aeds-radius-xl": theme.radiusXl,
    "--aeds-shadow-sm": theme.shadowSm,
    "--aeds-shadow-md": theme.shadowMd,
    "--aeds-shadow-lg": theme.shadowLg,
    "--aeds-glow-sm": `0 10px 22px ${theme.primary}24`,
    "--aeds-glow-md": `0 18px 44px ${theme.primary}28`,
    "--aeds-font-body": theme.fontBody,
    "--aeds-font-display": theme.fontDisplay,
    "--tenant-font-family": theme.fontFamily || theme.fontBody,
    "--tenant-button": theme.buttonColor || theme.primary,
    "--tenant-button-rgb": `${buttonRgb.r} ${buttonRgb.g} ${buttonRgb.b}`,
    "--tenant-button-hover": darken(theme.buttonColor || theme.primary, 0.18),
    "--tenant-button-text": theme.buttonText || "#FFFFFF",
    "--tenant-button-foreground": theme.buttonText || getReadableText(theme.buttonColor || theme.primary),
    "--tenant-primary-foreground": getReadableText(theme.primary),
    "--tenant-ring": `${theme.primary}22`,

    // Legacy aliases used in older modules/styles
    "--brand-color": theme.primary,
    "--brand-accent": theme.accent,
    "--brand-print-primary": theme.printPrimary || theme.primaryDark,
    "--brand-print-accent": theme.printAccent || theme.accent,
    "--sidebar-bg": theme.sidebarBg || theme.primaryDark,
    "--sidebar-text": theme.sidebarText || getReadableText(theme.sidebarBg || theme.primaryDark || theme.primary),
    "--button-bg": theme.buttonColor || theme.primary,
    "--table-header-bg": theme.tableHeader || mix(theme.primary, "#FFFFFF", 0.9),
    "--report-header-bg": theme.reportHeader || theme.primaryDark,

    // Legacy semantic palette remains stable. Tenant colours are exposed only
    // through --tenant-* variables so status badges, cards and table surfaces
    // do not become a single large brand-colour fill.
  }
}
