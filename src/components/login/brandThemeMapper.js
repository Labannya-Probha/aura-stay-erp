import { FALLBACK_BRAND } from "./login.constants"

function cleanUrl(value) {
  const url = String(value || "").trim()
  return url || null
}

function normalizeJson(value, fallback) {
  if (!value) return fallback
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

export function mapBrandTheme(settings = {}) {
  return {
    tenantId: settings.tenant_id || null,
    slug: settings.slug || FALLBACK_BRAND.slug,

    name: settings.name || settings.property_name || FALLBACK_BRAND.name,
    software: settings.software_name || FALLBACK_BRAND.software,

    logo: cleanUrl(settings.logo_url) || FALLBACK_BRAND.logo,
    logoLight: cleanUrl(settings.logo_light_url) || cleanUrl(settings.logo_url),
    logoDark: cleanUrl(settings.logo_dark_url) || cleanUrl(settings.logo_url),
    logoMark: cleanUrl(settings.logo_mark_url) || cleanUrl(settings.logo_url),
    favicon: cleanUrl(settings.favicon_url),

    poster: cleanUrl(settings.login_background_poster_url) || FALLBACK_BRAND.poster,
    video: cleanUrl(settings.login_background_video_url) || FALLBACK_BRAND.video,

    loginTitle: settings.login_title || FALLBACK_BRAND.loginTitle,
    loginSubtitle: settings.login_subtitle || FALLBACK_BRAND.loginSubtitle,

    primaryColor: settings.primary_color || "#0F766E",
    secondaryColor: settings.secondary_color || "#0B3B36",
    accentColor: settings.accent_color || "#14B8A6",
    surfaceColor: settings.surface_color || "#FFFFFF",
    pageBackground: settings.page_background || "#F8FAFC",
    cardBackground: settings.card_background || "#FFFFFF",
    textColor: settings.text_color || "#0F172A",
    mutedTextColor: settings.muted_text_color || "#64748B",

    sidebarColor: settings.sidebar_color || "#062F2A",
    sidebarTextColor: settings.sidebar_text_color || "#E2E8F0",
    topbarColor: settings.topbar_color || "#FFFFFF",
    buttonColor: settings.button_color || settings.primary_color || "#0F766E",
    buttonTextColor: settings.button_text_color || "#FFFFFF",

    borderRadius: settings.border_radius || "1rem",
    cardRadius: settings.card_radius || "1.5rem",
    inputRadius: settings.input_radius || "1rem",
    buttonRadius: settings.button_radius || "1rem",

    shadowSm: settings.shadow_sm || "0 1px 2px rgba(15,23,42,0.06)",
    shadowMd: settings.shadow_md || "0 12px 35px rgba(15,23,42,0.10)",
    shadowLg: settings.shadow_lg || "0 30px 90px rgba(15,23,42,0.18)",

    fontFamily: settings.font_family || "Inter",
    headingFontFamily: settings.heading_font_family || "Inter",
    baseFontSize: settings.base_font_size || "14px",

    animationSpeed: settings.animation_speed || "250ms",
    transitionCurve: settings.transition_curve || "cubic-bezier(.2,.8,.2,1)",

    themeMode: settings.theme_mode || "light",
    allowDarkMode: settings.allow_dark_mode ?? true,

    glassOpacity: Number(settings.glass_opacity ?? 0.85),
    loginOverlayColor: settings.login_overlay_color || "rgba(0,0,0,0.35)",
    loginGradientFrom: settings.login_gradient_from || settings.primary_color || "#0F766E",
    loginGradientTo: settings.login_gradient_to || "#031713",

    chartPalette: normalizeJson(settings.chart_palette, [
      "#0F766E",
      "#14B8A6",
      "#2563EB",
      "#F59E0B",
      "#DC2626",
    ]),
    dashboardPalette: normalizeJson(settings.dashboard_palette, {}),
  }
}

export function getBrandCssVariables(brand) {
  return {
    "--tenant-primary": brand.primaryColor,
    "--tenant-secondary": brand.secondaryColor,
    "--tenant-accent": brand.accentColor,
    "--tenant-surface": brand.surfaceColor,
    "--tenant-page": brand.pageBackground,
    "--tenant-card": brand.cardBackground,
    "--tenant-text": brand.textColor,
    "--tenant-muted": brand.mutedTextColor,
    "--tenant-sidebar": brand.sidebarColor,
    "--tenant-sidebar-text": brand.sidebarTextColor,
    "--tenant-topbar": brand.topbarColor,
    "--tenant-button": brand.buttonColor,
    "--tenant-button-text": brand.buttonTextColor,
    "--tenant-radius": brand.borderRadius,
    "--tenant-card-radius": brand.cardRadius,
    "--tenant-input-radius": brand.inputRadius,
    "--tenant-button-radius": brand.buttonRadius,
    "--tenant-shadow-sm": brand.shadowSm,
    "--tenant-shadow-md": brand.shadowMd,
    "--tenant-shadow-lg": brand.shadowLg,
    "--tenant-font": brand.fontFamily,
    "--tenant-heading-font": brand.headingFontFamily,
    "--tenant-base-font-size": brand.baseFontSize,
    "--tenant-animation-speed": brand.animationSpeed,
    "--tenant-transition-curve": brand.transitionCurve,
    "--tenant-glass-opacity": String(brand.glassOpacity),
    "--tenant-login-overlay": brand.loginOverlayColor,
    "--tenant-login-gradient-from": brand.loginGradientFrom,
    "--tenant-login-gradient-to": brand.loginGradientTo,
  }
}