import { useState } from 'react'
import { Eye, EyeOff, LogIn, Shield, Loader2, UserRound, KeyRound, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { setTenantId } from '../../lib/tenant'
import { cleanSlug } from './login.constants'

export default function LoginForm({ brand = {}, routeSlug }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const tenantSlug = cleanSlug(brand.slug || routeSlug)

  async function signIn() {
    setBusy(true)
    setErr('')

    try {
      const input = username.trim().toLowerCase()

      if (!input) throw new Error('Enter your username or email')
      if (!password) throw new Error('Enter your password')
      if (!tenantSlug) throw new Error('Tenant could not be detected from URL')

      try {
        sessionStorage.setItem('aura_tenant_slug', tenantSlug)
      } catch {
        // ignore storage errors
      }

      const { data: tenantRow, error: tenantError } = await supabase
        .from('properties')
        .select('id')
        .eq('slug', tenantSlug)
        .limit(1)
        .maybeSingle()

      if (tenantError) throw tenantError
      if (!tenantRow?.id) throw new Error('Invalid tenant code')

      setTenantId(tenantRow.id)

      const { data: email, error: rpcError } = await supabase.rpc('email_for_username', {
        p_username: input,
        p_slug: tenantSlug,
      })

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
    <>
      <form
        className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          signIn()
        }}
      >
        <div>
          <label
            htmlFor="login-tenant"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600"
          >
            Tenant code
          </label>
          <div className="relative">
            <Building2
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="login-tenant"
              name="tenant"
              type="text"
              value={tenantSlug}
              readOnly
              className="h-11 w-full border border-slate-200 bg-slate-100/90 px-11 text-[14px] text-slate-700 outline-none sm:h-12"
              style={{ borderRadius: 'var(--tenant-input-radius)' }}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600"
          >
            Username or email
          </label>
          <div className="relative">
            <UserRound
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="login-email"
              name="email"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or email"
              autoComplete="username"
              className="h-11 w-full border border-slate-200 bg-blue-50/85 px-11 text-[14px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--tenant-primary)] focus:bg-white focus:ring-4 focus:ring-[color:var(--tenant-primary)]/15 sm:h-12"
              style={{ borderRadius: 'var(--tenant-input-radius)' }}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600"
          >
            Password
          </label>

          <div className="relative">
            <KeyRound
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-11 w-full border border-slate-200 bg-blue-50/85 px-11 pr-12 text-[14px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--tenant-primary)] focus:bg-white focus:ring-4 focus:ring-[color:var(--tenant-primary)]/15 sm:h-12"
              style={{ borderRadius: 'var(--tenant-input-radius)' }}
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !username || !password}
          style={{
            background: 'linear-gradient(135deg, var(--tenant-button), var(--tenant-accent))',
            color: 'var(--tenant-button-text)',
            borderRadius: 'var(--tenant-button-radius)',
          }}
          className="group flex h-11 w-full items-center justify-center gap-2 px-5 text-[15px] font-bold shadow-xl shadow-teal-950/20 transition duration-300 hover:translate-y-[-1px] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:h-12"
        >
          {busy ? (
            <Loader2 size={19} className="animate-spin" />
          ) : (
            <LogIn size={19} className="transition group-hover:translate-x-0.5" />
          )}

          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-200/80 pt-3 text-[11px] font-semibold text-slate-500 sm:mt-7 sm:pt-4 sm:text-xs">
        <Shield size={14} />
        Secure multi-tenant ERP access
      </div>
    </>
  )
}
