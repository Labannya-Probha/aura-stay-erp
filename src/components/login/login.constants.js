export const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_SLUG || "demo"

export const FALLBACK_BRAND = {
  tenantId: null,
  slug: DEFAULT_SLUG,
  name: "Aura Stay",
  software: "Aura Stay ERP",
  logo: null,
  poster:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
  video:
    "https://gwllsoembqacolzfrquu.supabase.co/storage/v1/object/public/branding/Aura%20Stay/Aura_Stay_ERP_er_jonno_Hotel_R.mp4",
  themeColor: "#0F766E",
  loginTitle: "Welcome back",
  loginSubtitle: "Sign in to your account to continue",
}

export function cleanSlug(value) {
  return String(value || DEFAULT_SLUG).trim().toLowerCase()
}