import { useEffect, useState } from 'react'
import { supabase, SUPABASE_CONFIG } from '../supabase'
import { fmtBDT, todayISO, setCurrency } from '../lib/helpers'
import { ROLES, ROLE_LABELS } from '../lib/roles'
import { Save, Plus, BedDouble, Percent, Building2, Trash2, Users, ShieldCheck, Upload, Image } from 'lucide-react'

export default function Settings({ userName, role, isAdmin, reloadCompany }) {
  // Branding & company profile: MANAGER+ADMIN. Staff roles: ADMIN only.
  const canManage = isAdmin || role === 'MANAGER'
  if (!canManage) {
    return (
      <div className="card p-8 max-w-xl">
        <h1 className="font-display text-xl font-bold text-pine mb-2 flex items-center gap-2"><ShieldCheck size={20} /> Manager access required</h1>
        <p className="text-sm text-pine/60">Company profile, branding, tax rates, room inventory and user roles can only be changed by a manager or administrator.</p>
      </div>
    )
  }
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-pine mb-1">Settings</h1>
      <p className="text-sm text-pine/60 mb-6">White-label branding, company profile, NBR tax rates, room inventory and user roles.</p>
      <div className="space-y-5">
        <BrandingCard reloadCompany={reloadCompany} />
        <TaxCard />
        <RoomsCard />
        <StaffCard isAdmin={isAdmin} />
      </div>
    </div>
  )
}

/* ---------------- BRANDING + COMPANY (white-label, req 8) ---------------- */
function BrandingCard({ reloadCompany }) {
  const [c, setC] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }
  const load = async () => { const { data } = await supabase.from('company_settings').select('*').eq('id', 1).single(); setC(data) }
  useEffect(() => { load() }, [])
  if (!c) return <div className="card p-5 text-pine/50">Loading…</div>
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }))

  const uploadLogo = async (file) => {
    if (!file) return
    setBusy(true)
    const ext = file.name.split('.').pop()
    const path = `logo_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { flash(error.message); setBusy(false); return }
    const { data: pub } = supabase.storage.from('branding').getPublicUrl(path)
    set('logo_url', pub.publicUrl)
    await supabase.from('company_settings').update({ logo_url: pub.publicUrl }).eq('id', 1)
    setBusy(false); flash('Logo uploaded.'); reloadCompany && reloadCompany()
  }

  const save = async () => {
    setBusy(true)
    const { error } = await supabase.from('company_settings').update({
      name: c.name, legal_name: c.legal_name, address: c.address, phone: c.phone, email: c.email,
      bin: c.bin, vat_circle: c.vat_circle, invoice_footer: c.invoice_footer,
      short_code: c.short_code, software_name: c.software_name, currency: c.currency,
      mushak610_threshold: +c.mushak610_threshold || 0, terms_conditions: c.terms_conditions, rounding_mode: c.rounding_mode || 'NEAREST_1', updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setBusy(false)
    if (error) flash(error.message)
    else { setCurrency(c.currency || '৳'); flash('Saved.'); reloadCompany && reloadCompany() }
  }

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-pine flex items-center gap-2 mb-4"><Building2 size={18} className="text-forest" /> Branding & company profile</h2>
      {msg && <div className="mb-3 px-3 py-2 rounded-lg bg-forest/10 text-forest text-sm">{msg}</div>}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-20 h-20 rounded-xl border border-leaf bg-paper flex items-center justify-center overflow-hidden">
          {c.logo_url ? <img src={c.logo_url} alt="logo" className="w-full h-full object-contain" /> : <Image size={26} className="text-pine/30" />}
        </div>
        <div>
          <label className="btn-ghost cursor-pointer"><Upload size={15} /> {busy ? 'Uploading…' : 'Upload logo'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
          </label>
          <p className="text-xs text-pine/50 mt-1">PNG/JPG/SVG. Appears on the sidebar and printed documents.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Software name (shown in app)</label><input className="input" value={c.software_name || ''} onChange={(e) => set('software_name', e.target.value)} /></div>
        <div><label className="label">Currency symbol</label><input className="input" value={c.currency || ''} onChange={(e) => set('currency', e.target.value)} /></div>
        <div><label className="label">Bill rounding</label>
          <select className="input" value={c.rounding_mode || 'NEAREST_1'} onChange={(e) => set('rounding_mode', e.target.value)}>
            <option value="NONE">No rounding</option>
            <option value="NEAREST_1">Nearest 1 (৳)</option>
            <option value="NEAREST_5">Nearest 5</option>
            <option value="NEAREST_10">Nearest 10</option>
          </select>
        </div>
        <div><label className="label">Property / brand name</label><input className="input" value={c.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
        <div><label className="label">Legal name</label><input className="input" value={c.legal_name || ''} onChange={(e) => set('legal_name', e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Address</label><input className="input" value={c.address || ''} onChange={(e) => set('address', e.target.value)} /></div>
        <div><label className="label">Phone</label><input className="input" value={c.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><label className="label">Email</label><input className="input" value={c.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
        <div><label className="label">BIN</label><input className="input money" value={c.bin || ''} onChange={(e) => set('bin', e.target.value)} /></div>
        <div><label className="label">Document short code (e.g. NER)</label><input className="input money" value={c.short_code || ''} onChange={(e) => set('short_code', e.target.value)} /></div>
        <div className="col-span-2"><label className="label">VAT circle / division</label><input className="input" value={c.vat_circle || ''} onChange={(e) => set('vat_circle', e.target.value)} /></div>
        <div><label className="label">Mushak-6.10 threshold</label><input type="number" className="input money" value={c.mushak610_threshold || 0} onChange={(e) => set('mushak610_threshold', e.target.value)} /></div>
        <div><label className="label">Invoice footer</label><input className="input" value={c.invoice_footer || ''} onChange={(e) => set('invoice_footer', e.target.value)} /></div>
      </div>
      <div className="mt-3"><label className="label">Default Terms &amp; Conditions (for quotations)</label><textarea className="input" rows={6} value={c.terms_conditions || ''} onChange={(e) => set('terms_conditions', e.target.value)} /></div>
      <button className="btn-primary mt-4" disabled={busy} onClick={save}><Save size={15} /> Save company profile</button>
    </div>
  )
}

/* ---------------- TAX RATES ---------------- */
function TaxCard() {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ charge_type: 'ROOM', vat_pct: '', sd_pct: 0, service_charge_pct: 0, effective_from: todayISO() })
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }
  const load = async () => { const { data } = await supabase.from('tax_config').select('*').order('charge_type').order('effective_from', { ascending: false }); setRows(data || []) }
  useEffect(() => { load() }, [])
  const add = async () => {
    const { error } = await supabase.from('tax_config').insert({ ...f, vat_pct: +f.vat_pct || 0, sd_pct: +f.sd_pct || 0, service_charge_pct: +f.service_charge_pct || 0 })
    if (error) flash(error.message); else { setF({ charge_type: 'ROOM', vat_pct: '', sd_pct: 0, service_charge_pct: 0, effective_from: todayISO() }); load() }
  }
  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-pine flex items-center gap-2 mb-4"><Percent size={18} className="text-forest" /> Tax rates (effective-dated)</h2>
      {msg && <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{msg}</div>}
      <div className="grid grid-cols-6 gap-2 mb-4">
        <select className="input" value={f.charge_type} onChange={(e) => setF({ ...f, charge_type: e.target.value })}>{['ROOM', 'RESTAURANT', 'LAUNDRY', 'TEA', 'PICKLE', 'SPORTS', 'OTHER'].map((t) => <option key={t}>{t}</option>)}</select>
        <input type="number" className="input money" placeholder="VAT %" value={f.vat_pct} onChange={(e) => setF({ ...f, vat_pct: e.target.value })} />
        <input type="number" className="input money" placeholder="SD %" value={f.sd_pct} onChange={(e) => setF({ ...f, sd_pct: e.target.value })} />
        <input type="number" className="input money" placeholder="SC %" value={f.service_charge_pct} onChange={(e) => setF({ ...f, service_charge_pct: e.target.value })} />
        <input type="date" className="input" value={f.effective_from} onChange={(e) => setF({ ...f, effective_from: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <table className="w-full">
        <thead><tr><th className="th">Charge type</th><th className="th text-right">VAT %</th><th className="th text-right">SD %</th><th className="th text-right">SC %</th><th className="th">Effective from</th></tr></thead>
        <tbody>
          {rows.map((r) => (<tr key={r.id}><td className="td text-sm font-medium">{r.charge_type}</td><td className="td money text-right">{r.vat_pct}</td><td className="td money text-right">{r.sd_pct}</td><td className="td money text-right">{r.service_charge_pct}</td><td className="td money text-xs">{r.effective_from}</td></tr>))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------------- ROOMS (with room_name, req 2) ---------------- */
function RoomsCard() {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ room_no: '', room_name: '', room_type: '', base_rate: '' })
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }
  const load = async () => { const { data } = await supabase.from('rooms').select('*').order('room_no'); setRows(data || []) }
  useEffect(() => { load() }, [])
  const add = async () => { if (!f.room_no) return; const { error } = await supabase.from('rooms').insert({ ...f, base_rate: +f.base_rate || 0 }); if (error) flash(error.message); else { setF({ room_no: '', room_name: '', room_type: '', base_rate: '' }); load() } }
  const toggle = async (r) => { await supabase.from('rooms').update({ is_active: !r.is_active }).eq('id', r.id); load() }
  const del = async (id) => { const { error } = await supabase.from('rooms').delete().eq('id', id); if (error) flash('In-use rooms cannot be deleted; deactivate instead.'); else load() }
  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-pine flex items-center gap-2 mb-4"><BedDouble size={18} className="text-forest" /> Rooms</h2>
      {msg && <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{msg}</div>}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <input className="input" placeholder="Room no" value={f.room_no} onChange={(e) => setF({ ...f, room_no: e.target.value })} />
        <input className="input" placeholder="Room name" value={f.room_name} onChange={(e) => setF({ ...f, room_name: e.target.value })} />
        <input className="input" placeholder="Type" value={f.room_type} onChange={(e) => setF({ ...f, room_type: e.target.value })} />
        <input type="number" className="input money" placeholder="Base rate" value={f.base_rate} onChange={(e) => setF({ ...f, base_rate: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <table className="w-full">
        <thead><tr><th className="th">Room no</th><th className="th">Name</th><th className="th">Type</th><th className="th text-right">Base rate</th><th className="th">Active</th><th className="th"></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={!r.is_active ? 'opacity-50' : ''}>
              <td className="td money font-semibold">{r.room_no}</td><td className="td text-sm">{r.room_name || '—'}</td>
              <td className="td text-sm">{r.room_type || '—'}</td><td className="td money text-right">{fmtBDT(r.base_rate)}</td>
              <td className="td"><button onClick={() => toggle(r)} className={`status-chip ${r.is_active ? 'bg-forest/15 text-forest' : 'bg-stone-200 text-stone-600'}`}>{r.is_active ? 'Active' : 'Inactive'}</button></td>
              <td className="td"><button onClick={() => del(r.id)} className="text-red-300 hover:text-red-600"><Trash2 size={13} /></button></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={6}>No rooms yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

/* ---------------- STAFF & ROLES (admin only) ---------------- */
function StaffCard({ isAdmin }) {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [nu, setNu] = useState({ full_name: '', username: '', password: '', role: 'FRONT_OFFICE' })
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 6000) }
  const load = async () => { const { data } = await supabase.from('v_staff').select('*').order('created_at'); setRows(data || []) }
  useEffect(() => { load() }, [])

  const LOGIN_DOMAIN = 'aura-stay.local' // system domain — staff never type it; they log in with the username only

  const addStaff = async () => {
    const uname = nu.username.trim().toLowerCase()
    if (!nu.full_name.trim() || !uname || nu.password.length < 6) { flash('Enter name, username and a password of at least 6 characters.'); return }
    if (/[^a-z0-9._-]/.test(uname)) { flash('Username can use letters, numbers, dot, dash and underscore only.'); return }
    setBusy(true)
    try {
      // Use a throwaway client so creating a user does NOT replace the admin's own session.
      const { createClient } = await import('@supabase/supabase-js')
      const tmp = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
      const email = `${uname}@${LOGIN_DOMAIN}`
      const { data, error } = await tmp.auth.signUp({ email, password: nu.password, options: { data: { username: uname, full_name: nu.full_name.trim() } } })
      if (error) throw error
      const newId = data?.user?.id
      if (newId) {
        // ensure profile reflects chosen role + name (trigger created the row; admin session can update it)
        await supabase.from('app_users').update({ role: nu.role, full_name: nu.full_name.trim(), username: uname }).eq('id', newId)
      }
      await tmp.auth.signOut()
      setNu({ full_name: '', username: '', password: '', role: 'FRONT_OFFICE' })
      await load()
      flash(`Staff "${uname}" created. They can sign in with that username and the password you set.`)
    } catch (e) {
      flash(e.message?.includes('already registered') ? 'That username is already taken.' : e.message)
    }
    setBusy(false)
  }

  const setRole = async (id, role) => { const { error } = await supabase.from('app_users').update({ role }).eq('id', id); if (error) flash('Admin access required.'); else load() }
  const toggle = async (u) => { const { error } = await supabase.from('app_users').update({ is_active: !u.is_active }).eq('id', u.id); if (error) flash('Admin access required.'); else load() }

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-pine flex items-center gap-2 mb-2"><Users size={18} className="text-forest" /> Staff & roles</h2>
      <p className="text-xs text-pine/50 mb-4">Create staff with a <b>username &amp; password</b> — no email needed. They sign in with the username only. The first account is the Administrator.</p>
      {msg && <div className="mb-3 px-3 py-2 rounded-lg bg-forest/10 text-forest text-sm">{msg}</div>}

      {isAdmin && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          <input className="input" placeholder="Full name" value={nu.full_name} onChange={(e) => setNu({ ...nu, full_name: e.target.value })} />
          <input className="input" placeholder="Username" autoCapitalize="none" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} />
          <input className="input" type="text" placeholder="Password (min 6)" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} />
          <select className="input" value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
          <button className="btn-primary justify-center" disabled={busy} onClick={addStaff}><Plus size={15} /> {busy ? 'Creating…' : 'Add staff'}</button>
        </div>
      )}

      <table className="w-full">
        <thead><tr><th className="th">Name</th><th className="th">Username</th><th className="th">Role</th><th className="th">Active</th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className={!u.is_active ? 'opacity-50' : ''}>
              <td className="td text-sm font-medium">{u.full_name || '—'}</td>
              <td className="td text-sm money">{u.username || (u.email ? u.email.split('@')[0] : '—')}</td>
              <td className="td">{isAdmin ? <select className="input !py-1 !w-40" value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select> : <span className="text-sm">{ROLE_LABELS[u.role] || u.role}</span>}</td>
              <td className="td"><button onClick={() => toggle(u)} disabled={!isAdmin} className={`status-chip ${u.is_active ? 'bg-forest/15 text-forest' : 'bg-stone-200 text-stone-600'}`}>{u.is_active ? 'Active' : 'Disabled'}</button></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={4}>No staff yet.</td></tr>}
        </tbody>
      </table>
      <p className="text-xs text-pine/50 mt-3">Note for resale / new installs: in Supabase → Authentication → Providers → Email, turn <b>off</b> “Confirm email” so username accounts work instantly (the system uses an internal address per user).</p>
    </div>
  )
}
