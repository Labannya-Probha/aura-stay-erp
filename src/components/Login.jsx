import { useState } from 'react'
import { supabase } from '../supabase'
import { Leaf, LogIn } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const signIn = async () => {
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErr(error.message)
    setBusy(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pine relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, #fff 28px)' }} />
      <div className="card w-full max-w-sm p-8 relative">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center">
            <Leaf size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-pine leading-tight">Novem ERP</h1>
            <p className="text-xs text-pine/60">Eco Resort Management · Sreemangal</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@novem.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && signIn()} />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full justify-center" onClick={signIn} disabled={busy || !email || !password}>
            <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-xs text-pine/50 text-center">Staff accounts are created by the administrator in Supabase → Authentication.</p>
        </div>
      </div>
    </div>
  )
}
