import { supabase } from "../../lib/supabase"
import { DEFAULT_SLUG, FALLBACK_BRAND } from "./login.constants"
import { mapBrandTheme } from "./brandThemeMapper"

export async function loadTenantBrand(routeSlug) {
  const cleanRouteSlug = String(routeSlug || DEFAULT_SLUG).trim().toLowerCase()

  const { data: settings, error } = await supabase
    .from("public_login_branding")
    .select("*")
    .eq("slug", cleanRouteSlug)
    .maybeSingle()

  if (error) console.error("Login branding load failed:", error)

  if (settings) return mapBrandTheme(settings)

  if (cleanRouteSlug !== DEFAULT_SLUG) {
    const { data: fallbackSettings } = await supabase
      .from("public_login_branding")
      .select("*")
      .eq("slug", DEFAULT_SLUG)
      .maybeSingle()

    if (fallbackSettings) return mapBrandTheme(fallbackSettings)
  }

  return {
    ...mapBrandTheme({}),
    ...FALLBACK_BRAND,
    slug: cleanRouteSlug,
  }
}