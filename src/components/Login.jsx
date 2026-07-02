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
  const tenantSlug =
    tenantCode.trim().toLowerCase() || tenant?.slug || effectiveSlug || DEFAULT_SLUG

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
    <main className="relative min-h-screen overflow-hidden bg-[#eef3f7]">
      {/* Page background image only, no full page video */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${posterUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/95 via-slate-100/85 to-emerald-950/20" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/70 bg-white/35 shadow-2xl backdrop-blur-xl lg:grid-cols-[420px_1fr]">
          {/* Left small brand card */}
          <aside className="relative hidden min-h-[620px] overflow-hidden lg:flex">
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

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-emerald-900/78 to-slate-950/88" />
            <div className="absolute inset-0 backdrop-blur-[1px]" />

            <div className="relative z-10 flex h-full flex-col justify-between p-10">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 shadow-lg">
                  {!logoFailed && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={brandName}
                      className="h-full w-full object-contain"
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <span className="text-2xl font-black text-white">A</span>
                  )}
                </div>

                <div>
                  <h1 className="text-xl font-bold text-white">{softwareName}</h1>
                  <p className="text-sm text-white/65">{brandName}</p>
                </div>
              </div>

              <div>
                <h2 className="text-[42px] font-black leading-[1.12] tracking-tight text-white">
                  Hospitality
                  <br />
                  management,
                  <br />
                  simplified.
                </h2>

                <p className="mt-7 text-[17px] leading-7 text-white/68">
                  A complete ERP platform for hotels, resorts and hospitality groups —
                  from reservations to accounting.
                </p>

                <div className="mt-9 flex flex-wrap gap-2">
                  {[
                    'Front Office',
                    'Reservations',
                    'Accounting',
                    'HR & Payroll',
                    'Reports',
                  ].map(item => (
                    <span
                      key={item}
                      className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[12px] font-semibold tracking-wide text-white/90 backdrop-blur-xl"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-white/45">
                © 2026 {brandName} · Enterprise ERP
              </p>
            </div>
          </aside>

          {/* Right login area */}
          <section className="flex min-h-[620px] items-center justify-center px-6 py-10">
            <div className="w-full max-w-[470px]">
              <div className="rounded-[28px] border border-white/60 bg-white/55 p-8 shadow-xl backdrop-blur-2xl">
                <div className="mb-8 flex items-center gap-3 lg:hidden">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-emerald-900/80 text-xl font-black text-white">
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
                    <h1 className="font-bold text-slate-950">{softwareName}</h1>
                    <p className="text-sm text-slate-500">{brandName}</p>
                  </div>
                </div>

                <h2 className="text-3xl font-black text-slate-950">Welcome back</h2>
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
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-600">
                      Username
                    </label>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="demo"
                      autoComplete="username"
                      className="w-full rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-600">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 pr-12 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-600">
                      Property / Tenant Code
                    </label>
                    <input
                      value={tenantCode}
                      onChange={e => setTenantCode(e.target.value)}
                      placeholder="demo"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="organization"
                      className="w-full rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 text-slate-950 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                    />
                  </div>

                  {err && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {err}
                    </div>
                  )}

                  <button
                    disabled={busy || !username || !password || !tenantCode}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 font-bold text-white shadow-xl shadow-teal-900/20 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogIn size={19} />
                    {busy ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>

                <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Shield size={14} />
                  Tenant: {tenantSlug} · Secure multi-tenant ERP access
                </div>
              </div>

              <p className="mt-7 text-center text-sm text-slate-400">
                © 2026 {brandName} · Powered by {softwareName}
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
