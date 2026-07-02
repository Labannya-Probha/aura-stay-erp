import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { Eye, EyeOff, LogIn, Shield, Loader2 } from 'lucide-react'

const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_SLUG || 'demo'

const FALLBACK_BRAND = {
  tenantId: null,
  slug: DEFAULT_SLUG,
  name: 'Aura Stay',
  software: 'Aura Stay ERP',
  logo: null,
  poster:
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
  video:
    'https://gwllsoembqacolzfrquu.supabase.co/storage/v1/object/public/branding/Aura_Stay_ERP_er_jonno_Hotel_R.mp4',
  themeColor: '#0F766E',
  loginTitle: 'Welcome back',
  loginSubtitle: 'Sign in to your account to continue',
}

function cleanSlug(value) {
  return String(value || DEFAULT_SLUG).trim().toLowerCase()
}

function useTenantBrand(routeSlug) {
  const [brand, setBrand] = useState(FALLBACK_BRAND)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)

      let property = null

      const { data: found } = await supabase
        .from('properties')
        .select('id, slug, name, is_active')
        .eq('slug', routeSlug)
        .maybeSingle()

      if (found?.is_active) property = found

      if (!property && routeSlug !== DEFAULT_SLUG) {
        const { data: fallbackProperty } = await supabase
          .from('properties')
          .select('id, slug, name, is_active')
          .eq('slug', DEFAULT_SLUG)
          .maybeSingle()

        if (fallbackProperty?.is_active) property = fallbackProperty
      }

      if (!alive) return

      if (!property) {
        setBrand({ ...FALLBACK_BRAND, slug: routeSlug })
        setLoading(false)
        return
      }

      const { data: settings } = await supabase
        .from('company_settings')
        .select(`
          name,
          software_name,
          logo_url,
          login_background_video_url,
          login_background_poster_url,
          login_theme_color,
          login_title,
          login_subtitle
        `)
        .eq('tenant_id', property.id)
        .maybeSingle()

      if (!alive) return

      setBrand({
        tenantId: property.id,
        slug: property.slug,
        name: settings?.name || property.name || FALLBACK_BRAND.name,
        software: settings?.software_name || FALLBACK_BRAND.software,
        logo: settings?.logo_url || FALLBACK_BRAND.logo,
        poster: settings?.login_background_poster_url || FALLBACK_BRAND.poster,
        video: settings?.login_background_video_url || FALLBACK_BRAND.video,
        themeColor: settings?.login_theme_color || FALLBACK_BRAND.themeColor,
        loginTitle: settings?.login_title || FALLBACK_BRAND.loginTitle,
        loginSubtitle: settings?.login_subtitle || FALLBACK_BRAND.loginSubtitle,
      })

      setLoading(false)
    }

    load()

    return () => {
      alive = false
    }
  }, [routeSlug])

  return { brand, loading }
}

function usePreloadImage(src) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setReady(false)
    setFailed(false)

    if (!src) return

    let alive = true
    const image = new Image()

    image.onload = () => {
      if (alive) setReady(true)
    }

    image.onerror = () => {
      if (alive) setFailed(true)
    }

    image.src = src

    return () => {
      alive = false
    }
  }, [src])

  return { ready, failed }
}

function BrandLogo({ brand, ready, failed, compact = false }) {
  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden border border-white/20 shadow-lg backdrop-blur-xl',
        compact
          ? 'h-12 w-12 rounded-xl bg-emerald-950 text-xl'
          : 'h-14 w-14 rounded-2xl bg-white/15 text-2xl',
      ].join(' ')}
    >
      {brand.logo && ready && !failed ? (
        <img
          key={brand.logo}
          src={brand.logo}
          alt={brand.name}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="font-black text-white">A</span>
      )}
    </div>
  )
}

export default function Login({ slug }) {
  const routeSlug = useMemo(() => cleanSlug(slug), [slug])
  const { brand, loading } = useTenantBrand(routeSlug)
  const logo = usePreloadImage(brand.logo)

  const [tenantCode, setTenantCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setTenantCode(brand.slug || routeSlug)
    setVideoReady(false)
  }, [brand.slug, routeSlug, brand.video])

  const tenantSlug = cleanSlug(tenantCode || brand.slug || routeSlug)

  async function signIn() {
    setBusy(true)
    setErr('')

    try {
      const input = username.trim().toLowerCase()

      if (!input) throw new Error('Enter your username or email')
      if (!password) throw new Error('Enter your password')
      if (!tenantSlug) throw new Error('Enter property / tenant code')

      const { data: email, error: rpcError } = await supabase.rpc(
        'email_for_username',
        {
          p_username: input,
          p_slug: tenantSlug,
        }
      )

      if (rpcError) throw rpcError
      if (!email) throw new Error('No active account found for this tenant')

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw new Error('Wrong username or password')
    } catch (error) {
      setErr(error.message || 'Unable to sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#031713] text-slate-950">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[480px_1fr]">
        <aside className="relative hidden min-h-screen overflow-hidden lg:flex">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${brand.themeColor} 0%, #06372f 48%, #020b12 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-black/18" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-14 py-12">
            <div className="flex items-center gap-4">
              <BrandLogo brand={brand} ready={logo.ready} failed={logo.failed} />
              <div>
                <h1 className="text-xl font-black text-white">{brand.software}</h1>
                <p className="text-sm font-medium text-white/65">{brand.name}</p>
              </div>
            </div>

            <div>
              <h2 className="text-[52px] font-black leading-[1.1] tracking-tight text-white">
                Hospitality
                <br />
                management,
                <br />
                simplified.
              </h2>

              <p className="mt-8 max-w-[390px] text-[17px] leading-8 text-white/72">
                A complete ERP platform for hotels, resorts and hospitality groups —
                from reservations to accounting.
              </p>

              <div className="mt-10 flex max-w-[390px] flex-wrap gap-2">
                {['Front Office', 'Reservations', 'Accounting', 'HR & Payroll', 'Reports'].map(
                  item => (
                    <span
                      key={item}
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[12px] font-bold text-white/90 backdrop-blur-xl"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            <p className="text-sm font-medium text-white/45">
              © 2026 {brand.software} | Powered by <b>Aura Stay</b>
            </p>
          </div>
        </aside>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${brand.poster})` }}
          />

          {!loading && brand.video && (
            <video
              key={brand.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={brand.poster}
              onCanPlay={() => setVideoReady(true)}
              onLoadedData={() => setVideoReady(true)}
              onError={() => setVideoReady(false)}
              className={[
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000',
                videoReady ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              <source src={brand.video} type="video/mp4" />
            </video>
          )}

          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-emerald-950/40" />

          <div className="relative z-10 w-full max-w-[460px] animate-[loginFloat_.65s_ease-out]">
            <div className="rounded-[30px] border border-white/55 bg-white/84 p-8 shadow-[0_30px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <BrandLogo
                  compact
                  brand={brand}
                  ready={logo.ready}
                  failed={logo.failed}
                />
                <div>
                  <h1 className="font-black text-slate-950">{brand.software}</h1>
                  <p className="text-sm text-slate-500">{brand.name}</p>
                </div>
              </div>

              <h2 className="text-3xl font-black text-slate-950">
                {brand.loginTitle}
              </h2>
              <p className="mt-2 text-slate-500">{brand.loginSubtitle}</p>

              <form
                className="mt-8 space-y-5"
                onSubmit={e => {
                  e.preventDefault()
                  signIn()
                }}
              >
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-600">
                    Username
                  </label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="demo"
                    autoComplete="username"
                    className="w-full rounded-2xl border border-slate-200 bg-blue-50/90 px-5 py-4 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-600">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-2xl border border-slate-200 bg-blue-50/90 px-5 py-4 pr-12 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-600">
                    Property / Tenant Code
                  </label>
                  <input
                    value={tenantCode}
                    onChange={e => setTenantCode(e.target.value)}
                    placeholder="demo"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="organization"
                    className="w-full rounded-2xl border border-slate-200 bg-blue-50/90 px-5 py-4 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                  />
                </div>

                {err && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {err}
                  </div>
                )}

                <button
                  disabled={busy || !username || !password || !tenantCode}
                  style={{ backgroundColor: brand.themeColor }}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold text-white shadow-xl shadow-teal-950/20 transition duration-300 hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {busy ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <LogIn
                      size={19}
                      className="transition group-hover:translate-x-0.5"
                    />
                  )}
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                <Shield size={14} />
                Secure multi-tenant ERP access
              </div>
            </div>
          </div>
        </section>
      </section>

      <style>{`
        @keyframes loginFloat {
          from {
            opacity: 0;
            transform: translateY(18px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        html,
        body,
        #root {
          background: #031713;
        }
      `}</style>
    </main>
  )
}
