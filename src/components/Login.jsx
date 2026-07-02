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
  const [tenantCode, setTenantCode] = useState(slug || DEFAULT_SLUG)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [tenant, setTenant] = useState(null)
  const [company, setCompany] = useState(null)
  const [logoFailed, setLogoFailed] = useState(false)

  const effectiveSlug = useMemo(() => {
    return String(slug || DEFAULT_SLUG).trim().toLowerCase()
  }, [slug])

  useEffect(() => {
    let alive = true

    async function loadTenant() {
      setErr('')
      setLogoFailed(false)
      setTenant(null)
      setCompany(null)
      setTenantCode(effectiveSlug)

      const { data: property } = await supabase
        .from('properties')
        .select('id, slug, name, is_active')
        .eq('slug', effectiveSlug)
        .maybeSingle()

      let finalProperty = property?.is_active ? property : null

      if (!finalProperty && effectiveSlug !== DEFAULT_SLUG) {
        const { data: fallbackProperty } = await supabase
          .from('properties')
          .select('id, slug, name, is_active')
          .eq('slug', DEFAULT_SLUG)
          .maybeSingle()

        if (fallbackProperty?.is_active) finalProperty = fallbackProperty
      }

      if (!alive) return

      if (finalProperty) {
        setTenant(finalProperty)
        setTenantCode(finalProperty.slug)

        const { data: settings } = await supabase
          .from('company_settings')
          .select(
            'name, software_name, logo_url, login_background_video_url, login_background_poster_url'
          )
          .eq('tenant_id', finalProperty.id)
          .maybeSingle()

        if (alive) setCompany(settings || null)
      }
    }

    loadTenant()

    return () => {
      alive = false
    }
  }, [effectiveSlug])

  const brandName = company?.name || tenant?.name || FALLBACK.name
  const softwareName = company?.software_name || FALLBACK.software
  const logoUrl = company?.logo_url || FALLBACK.logo
  const videoUrl = company?.login_background_video_url || FALLBACK.video
  const posterUrl = company?.login_background_poster_url || FALLBACK.poster
  const tenantSlug = tenantCode.trim().toLowerCase() || tenant?.slug || effectiveSlug || DEFAULT_SLUG

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={posterUrl}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-teal-950/70 to-slate-950/90" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <section className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <aside className="hidden lg:flex flex-col justify-between border-r border-white/10 bg-white/[0.06] p-14 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 shadow-lg">
                {!logoFailed && logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="h-full w-full object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <span className="text-3xl font-black text-white">A</span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">{softwareName}</h1>
                <p className="text-white/65">{brandName}</p>
              </div>
            </div>

            <div className="mt-28 max-w-xl">
              <h2 className="text-5xl font-black leading-tight tracking-tight text-white">
                Hospitality
                <br />
                management,
                <br />
                simplified.
              </h2>

              <p className="mt-8 max-w-md text-xl leading-8 text-white/70">
                A complete ERP platform for hotels, resorts and hospitality groups —
                from reservations to accounting.
              </p>

              <div className="mt-12 flex flex-wrap gap-3">
                {['Front Office', 'Reservations', 'Accounting', 'HR & Payroll', 'Reports'].map(
                  item => (
                    <span
                      key={item}
                      className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-white/85 backdrop-blur-md"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-white/45">© 2026 {brandName} · Enterprise ERP</p>
        </aside>

        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-xl">
            <div className="rounded-[2rem] border border-white/25 bg-white/15 p-8 shadow-2xl backdrop-blur-2xl">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/20 text-xl font-black text-white">
                  {!logoFailed && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={brandName}
                      className="h-full w-full object-contain"
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    'A'
                  )}
                </div>

                <div>
                  <h1 className="font-bold text-white">{softwareName}</h1>
                  <p className="text-sm text-white/60">{brandName}</p>
                </div>
              </div>

              <h2 className="text-3xl font-black text-white">Welcome back</h2>
              <p className="mt-2 text-white/65">Sign in to your account to continue</p>

              <form
                className="mt-8 space-y-5"
                onSubmit={e => {
                  e.preventDefault()
                  signIn()
                }}
              >
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                    Username
                  </label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="demo"
                    autoComplete="username"
                    className="w-full rounded-2xl border border-white/25 bg-white/20 px-5 py-4 text-white placeholder-white/45 outline-none backdrop-blur-md transition focus:border-white/60 focus:bg-white/25"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-2xl border border-white/25 bg-white/20 px-5 py-4 pr-12 text-white placeholder-white/45 outline-none backdrop-blur-md transition focus:border-white/60 focus:bg-white/25"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/55 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                    Property / Tenant Code
                  </label>
                  <input
                    value={tenantCode}
                    onChange={e => setTenantCode(e.target.value)}
                    placeholder="demo"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="organization"
                    className="w-full rounded-2xl border border-white/25 bg-white/20 px-5 py-4 text-white placeholder-white/45 outline-none backdrop-blur-md transition focus:border-white/60 focus:bg-white/25"
                  />
                </div>

                {err && (
                  <div className="rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                    {err}
                  </div>
                )}

                <button
                  disabled={busy || !username || !password || !tenantCode}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 font-bold text-white shadow-xl shadow-teal-950/30 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogIn size={19} />
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="mt-7 flex items-center justify-center gap-2 text-xs text-white/45">
                <Shield size={14} />
                Tenant: {tenantSlug} · Secure multi-tenant ERP access
              </div>
            </div>

            <p className="mt-7 text-center text-sm text-white/45">
              © 2026 {brandName} · Powered by {softwareName}
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}
