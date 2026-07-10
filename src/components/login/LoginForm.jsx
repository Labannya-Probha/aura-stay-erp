import { useState } from "react"
import { Eye, EyeOff, LogIn, Shield, Loader2 } from "lucide-react"
import { supabase } from "../../supabase"
import { cleanSlug } from "./login.constants"

export default function LoginForm({ brand = {}, routeSlug }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")

  const tenantSlug = cleanSlug(brand.slug || routeSlug)

  async function signIn() {
    setBusy(true)
    setErr("")

    try {
      const input = username.trim().toLowerCase()

      if (!input) throw new Error("Enter your username or email")
      if (!password) throw new Error("Enter your password")
      if (!tenantSlug) throw new Error("Tenant could not be detected from URL")

      const { data: email, error: rpcError } = await supabase.rpc(
        "email_for_username",
        {
          p_username: input,
          p_slug: tenantSlug,
        }
      )

      if (rpcError) throw rpcError
      if (!email) throw new Error("No active account found for this tenant")

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw new Error("Wrong username or password")
    } catch (error) {
      setErr(error.message || "Unable to sign in")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          signIn()
        }}
      >
        <div>
          <label
            htmlFor="login-tenant"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700"
          >
            Tenant code
          </label>
          <input
            id="login-tenant"
            name="tenant"
            type="text"
            value={tenantSlug}
            readOnly
            className="w-full border border-slate-200 bg-slate-100 px-5 py-4 text-slate-700 outline-none"
            style={{ borderRadius: "var(--tenant-input-radius)" }}
          />
        </div>

        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700"
          >
            Username or email
          </label>
          <input
            id="login-email"
            name="email"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username or email"
            autoComplete="username"
            className="w-full border border-slate-200 bg-blue-50/90 px-5 py-4 text-slate-950 outline-none transition focus:border-[color:var(--tenant-primary)] focus:bg-white focus:ring-4 focus:ring-[color:var(--tenant-primary)]/15"
            style={{ borderRadius: "var(--tenant-input-radius)" }}
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full border border-slate-200 bg-blue-50/90 px-5 py-4 pr-12 text-slate-950 outline-none transition focus:border-[color:var(--tenant-primary)] focus:bg-white focus:ring-4 focus:ring-[color:var(--tenant-primary)]/15"
              style={{ borderRadius: "var(--tenant-input-radius)" }}
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
            background:
              "linear-gradient(135deg, var(--tenant-button), var(--tenant-accent))",
            color: "var(--tenant-button-text)",
            borderRadius: "var(--tenant-button-radius)",
          }}
          className="group flex w-full items-center justify-center gap-2 px-5 py-4 font-bold shadow-xl shadow-teal-950/20 transition duration-300 hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {busy ? (
            <Loader2 size={19} className="animate-spin" />
          ) : (
            <LogIn
              size={19}
              className="transition group-hover:translate-x-0.5"
            />
          )}

          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-7 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <Shield size={14} />
        Secure multi-tenant ERP access
      </div>
    </>
  )
}