import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react'

const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_SLUG || 'demo'

const FALLBACK = {
  name: 'Aura Stay',
  software: 'Aura Stay ERP',
  logo: null,
  poster:
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
  video:
    'https://gwllsoembqacolzfrquu.supabase.co/storage/v1/object/public/branding/Aura_Stay_ERP_er_jonno_Hotel_R.mp4',
}

export default function Login({ slug }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tenantCode, setTenantCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const [brand, setBrand] = useState({
    tenantId: null,
    slug: DEFAULT_SLUG,
    name: FALLBACK.name,
    software: FALLBACK.software,
    logo: FALLBACK.logo,
    poster: FALLBACK.poster,
    video: FALLBACK.video,
  })

  const [brandLoading, setBrandLoading] = useState(true)
  const [logoFailed, setLogoFailed] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const routeSlug = useMemo(() => {
    return String(slug || DEFAULT_SLUG).trim().toLowerCase()
  }, [slug])

  useEffect(() => {
    let alive = true

    async function loadBrand() {
      setBrandLoading(true)
      setLogoFailed(false)
      setVideoReady(false)
      setErr('')

      let finalProperty = null

      const { data: property } = await supabase
        .from('properties')
        .select('id, slug, name, is_active')
        .eq('slug', routeSlug)
        .maybeSingle()

      if (property?.is_active) {
        finalProperty = property
      }

      if (!finalProperty && routeSlug !== DEFAULT_SLUG) {
        const { data: fallbackProperty } = await supabase
          .from('properties')
          .select('id, slug, name, is_active')
          .eq('slug', DEFAULT_SLUG)
          .maybeSingle()

        if (fallbackProperty?.is_active) {
          finalProperty = fallbackProperty
        }
      }

      if (!alive) return

      if (!finalProperty) {
        setTenantCode(routeSlug)
        setBrand(prev => ({
          ...prev,
          slug: routeSlug,
        }))
        setBrandLoading(false)
        return
      }

      const { data: settings } = await supabase
        .from('company_settings')
        .select(
          'name, software_name, logo_url, login_background_video_url, login_background_poster_url'
        )
        .eq('tenant_id', finalProperty.id)
        .maybeSingle()

      if (!alive) return

      const nextBrand = {
        tenantId: finalProperty.id,
        slug: finalProperty.slug,
        name: settings?.name || finalProperty.name || FALLBACK.name,
        software: settings?.software_name || FALLBACK.software,
        logo: settings?.logo_url || FALLBACK.logo,
        poster: settings?.login_background_poster_url || FALLBACK.poster,
        video: settings?.login_background_video_url || FALLBACK.video,
      }

      setBrand(nextBrand)
      setTenantCode(finalProperty.slug)
      setBrandLoading(false)
    }

    loadBrand()

    return () => {
      alive = false
    }
  }, [routeSlug])

  const tenantSlug =
    tenantCode.trim().toLowerCase() || brand.slug || routeSlug || DEFAULT_SLUG

  async function signIn() {
    setBusy(true)
    setErr('')

    try {
      const input = username.trim().toLowerCase()

      if (!input) throw new Error('Enter your username or email')
      if (!password) throw new Error('Enter your password')
      if (!tenantSlug) throw new Error('Enter property / tenant code')

      const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
        'email_for_username',
        {
          p_username: input,
          p_slug: tenantSlug,
        }
      )

      if (rpcError) throw rpcError
      if (!resolvedEmail) throw new Error('No active account found for this tenant')

      const { error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      })

      if (error) throw new Error('Wrong username or password')
    } catch (e) {
      setErr(e.message || 'Unable to sign in')
    } finally {
      setBusy(false)
    }
  }

  function BrandLogo({ mobile = false }) {
    return (
      <div
        className={
          mobile
            ? 'flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-emerald-900 text-xl font-black text-white'
            : 'flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-xl'
        }
      >
        {!brandLoading && !logoFailed && brand.logo ? (
          <img
            key={brand.logo}
            src={brand.logo}
            alt={brand.name}
            className="h-full w-full object-contain"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className={mobile ? 'text-xl font-black' : 'text-2xl font-black'}>
            A
          </span>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[430px_1fr] xl:grid-cols-[500px_1fr]">
        <aside className="relative hidden min-h-screen overflow-hidden bg-emerald-950 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950" />
          <div className="absolute inset-0 bg-black/15" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-12 py-12 xl:px-14">
            <div className="flex items-center gap-4">
              <BrandLogo />

              <div>
                <h1 className="text-xl font-black text-white">
                  {brand.software}
                </h1>
                <p className="text-sm font-medium text-white/65">
                  {brand.name}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-[44px] font-black leading-[1.12] tracking-tight text-white xl:text-[52px]">
                Hospitality
                <br />
                management,
                <br />
                simplified.
              </h2>

              <p className="mt-8 max-w-[390px] text-[17px] leading-8 text-white/70">
                A complete ERP platform for hotels, resorts and hospitality groups —
                from reservations to accounting.
              </p>

              <div className="mt-10 flex max-w-[390px] flex-wrap gap-2">
                {[
                  'Front Office',
                  'Reservations',
                  'Accounting',
                  'HR & Payroll',
                  'Reports',
                ].map(item => (
                  <span
                    key={item}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[12px] font-bold text-white/90 backdrop-blur-xl"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm font-medium text-white/45">
              © 2026 {brand.software} | Powered by <b>Aura Stay</b>
            </p>
          </div>
        </aside>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
            style={{ backgroundImage: `url(${brand.poster})` }}
          />

          {!brandLoading && brand.video && (
            <video
              key={brand.video}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster={brand.poster}
              onCanPlay={() => setVideoReady(true)}
              onError={() => setVideoReady(false)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src={brand.video} type="video/mp4" />
            </video>
          )}

          <div className="absolute inset-0 bg-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/35 via-transparent to-emerald-950/45" />

          <div className="relative z-10 w-full max-w-[490px]">
            <div className="rounded-[28px] border border-white/55 bg-white/82 p-8 shadow-2xl backdrop-blur-2xl">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <BrandLogo mobile />

                <div>
                  <h1 className="font-black text-slate-950">
                    {brand.software}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {brand.name}
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-black text-slate-950">
                Welcome back
              </h2>
              <p className="mt-2 text-slate-500">
                Sign in to your account to continue
              </p>

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
                    className="w-full rounded-2xl border border-slate-200 bg-blue-50/85 px-5 py-4 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
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
                      className="w-full rounded-2xl border border-slate-200 bg-blue-50/85 px-5 py-4 pr-12 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
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
                    className="w-full rounded-2xl border border-slate-200 bg-blue-50/85 px-5 py-4 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                  />
                </div>

                {err && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {err}
                  </div>
                )}

                <button
                  disabled={busy || !username || !password || !tenantCode}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 font-bold text-white shadow-xl shadow-teal-950/20 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogIn size={19} />
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
    </main>
  )
}
