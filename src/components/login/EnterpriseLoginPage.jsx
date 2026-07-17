import { useState } from "react"
import { motion } from "framer-motion"
import { User, Lock, ShieldCheck, AlertCircle } from "lucide-react"

import TenantLogo from "@/components/branding/TenantLogo"
import TenantVideoBackground from "@/components/branding/TenantVideoBackground"
import { tenantConfig } from "@/config/tenant.config"
import { signInWithUsername } from "@/services/authService"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function EnterpriseLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")

      if (!username || !password) {
        setError("Username and password are required.")
        return
      }

      await signInWithUsername(username, password)
    } catch (err) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <TenantVideoBackground />

      <section className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <div className="flex items-center gap-3">
            <TenantLogo className="h-12" />
            <div>
              <h1 className="text-xl font-semibold">{tenantConfig.name}</h1>
              <p className="text-sm text-slate-300">{tenantConfig.subtitle}</p>
            </div>
          </div>

          <div className="max-w-xl">
            <Badge className="mb-5 bg-white/10 text-white backdrop-blur">
              AEDS Enterprise Access
            </Badge>
            <h2 className="text-5xl font-semibold leading-tight tracking-tight">
              Hospitality ERP built for multi-tenant operations.
            </h2>
            <p className="mt-5 text-lg text-slate-300">
              Rooms, reservations, POS, inventory, accounts, reports and
              tenant-wise branding in one enterprise platform.
            </p>
          </div>

          <p className="text-sm text-slate-400">
            © 2026 {tenantConfig.name}. Secure enterprise login.
          </p>
        </div>

        <div className="flex items-center justify-center px-5 py-10">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <Card className="border-white/15 bg-white/10 shadow-2xl backdrop-blur-2xl">
              <CardContent className="p-7 sm:p-8">
                <div className="mb-8 text-center">
                  <TenantLogo className="mx-auto mb-4 h-14" />
                  <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Welcome back
                  </h1>
                  <p className="mt-2 text-sm text-slate-300">
                    Sign in to continue to {tenantConfig.shortName}.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        autoComplete="username"
                        className="h-11 border-white/10 bg-white/90 pl-10 text-slate-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-11 border-white/10 bg-white/90 pl-10 text-slate-950"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl text-base font-semibold shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Signing in..." : "Sign in securely"}
                  </Button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="h-4 w-4" />
                  Protected by tenant-aware access control
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </main>
  )
}