import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { fmtBDT, fmtDate, todayISO } from '../lib/helpers'
import { Save, Plus, BedDouble, Percent, Building2, Trash2 } from 'lucide-react'

export default function Settings() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-pine mb-1">Settings</h1>
      <p className="text-sm text-pine/60 mb-6">Company profile, NBR tax rates, and room inventory.</p>
      <div className="space-y-5">
        <CompanyCard />
        <TaxCard />
        <RoomsCard />
      </div>
    </div>
  )
}

/* ---------- Company & BIN ---------- */
function CompanyCard() {
  const [f, setF] = useState(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    supabase.from('company_settings').select('*').eq('id', 1).single().then(({ data }) => setF(data))
  }, [])
  if (!f) return null
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    const { id, updated_at, ...rest } = f
    await supabase.from('company_settings').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', 1)
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }
  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-pine mb-3 flex items-center gap-2"><Building2 size={17} /> Company profile (prints on all documents)</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div><label className="label">Resort name</label><input className="input" value={f.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
        <div><label className="label">Legal name</label><input className="input" value={f.legal_name || ''} onChange={(e) => set('legal_name', e.target.value)} /></div>
        <div><label className="label">BIN (Mushak-2.1) *</label><input className="input money" placeholder="9-digit BIN" value={f.bin || ''} onChange={(e) => set('bin', e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Address</label><input className="input" value={f.address || ''} onChange={(e) => set('address', e.target.value)} /></div>
        <div><label className="label">VAT circle / division</label><input className="input" value={f.vat_circle || ''} onChange={(e) => set('vat_circle', e.target.value)} /></div>
        <div><label className="label">Phone</label><input className="input" value={f.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><label className="label">Email</label><input className="input" value={f.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
        <div><label className="label">Invoice footer line</label><input className="input" value={f.invoice_footer || ''} onChange={(e) => set('invoice_footer', e.target.value)} /></div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button className="btn-primary" onClick={save}><Save size={15} /> Save company profile</button>
        {saved && <span className="text-sm text-forest font-semibold">Saved.</span>}
        {!f.bin && <span className="text-xs text-amber">BIN is blank — fill it before issuing Mushak-6.3 invoices.</span>}
      </div>
    </div>
  )
}

/* ---------- Tax rates ---------- */
function TaxCard() {
  const [rows, setRows] = useState([])
  const [n, setN] = useState({ charge_type: 'ROOM', vat_pct: '', sd_pct: 0, service_charge_pct: '', effective_from: todayISO() })
  const load = () => supabase.from('tax_config').select('*').order('charge_type').order('effective_from', { ascending: false }).then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, [])

  const add = async () => {
    if (n.vat_pct === '' || n.service_charge_pct === '') return
    await supabase.from('tax_config').insert({ ...n, vat_pct: +n.vat_pct, sd_pct: +n.sd_pct, service_charge_pct: +n.service_charge_pct })
    setN({ charge_type: 'ROOM', vat_pct: '', sd_pct: 0, service_charge_pct: '', effective_from: todayISO() })
    load()
  }

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-pine mb-1 flex items-center gap-2"><Percent size={17} /> Tax configuration (VAT · SD · Service Charge)</h3>
      <p className="text-xs text-amber mb-3">Rates are never hardcoded — the newest row effective on the charge date is applied. The seeded defaults must be verified with your VAT consultant against current NBR rules before go-live.</p>
      <div className="grid grid-cols-6 gap-2 mb-4 items-end">
        <div><label className="label">Charge type</label>
          <select className="input" value={n.charge_type} onChange={(e) => setN({ ...n, charge_type: e.target.value })}>
            {['ROOM', 'RESTAURANT', 'LAUNDRY', 'OTHER'].map((t) => <option key={t}>{t}</option>)}
          </select></div>
        <div><label className="label">VAT %</label><input type="number" className="input money" value={n.vat_pct} onChange={(e) => setN({ ...n, vat_pct: e.target.value })} /></div>
        <div><label className="label">SD %</label><input type="number" className="input money" value={n.sd_pct} onChange={(e) => setN({ ...n, sd_pct: e.target.value })} /></div>
        <div><label className="label">Service charge %</label><input type="number" className="input money" value={n.service_charge_pct} onChange={(e) => setN({ ...n, service_charge_pct: e.target.value })} /></div>
        <div><label className="label">Effective from</label><input type="date" className="input" value={n.effective_from} onChange={(e) => setN({ ...n, effective_from: e.target.value })} /></div>
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Add rate</button>
      </div>
      <table className="w-full">
        <thead><tr><th className="th">Type</th><th className="th text-right">VAT %</th><th className="th text-right">SD %</th><th className="th text-right">SC %</th><th className="th">Effective from</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold text-sm">{r.charge_type}</td>
              <td className="td money text-right">{r.vat_pct}</td>
              <td className="td money text-right">{r.sd_pct}</td>
              <td className="td money text-right">{r.service_charge_pct}</td>
              <td className="td money text-xs">{fmtDate(r.effective_from)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Rooms ---------- */
function RoomsCard() {
  const [rows, setRows] = useState([])
  const [n, setN] = useState({ room_no: '', room_type: 'Standard', base_rate: '' })
  const load = () => supabase.from('rooms').select('*').order('room_no').then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!n.room_no || n.base_rate === '') return
    const { error } = await supabase.from('rooms').insert({ ...n, base_rate: +n.base_rate })
    if (!error) { setN({ room_no: '', room_type: 'Standard', base_rate: '' }); load() }
  }
  const toggle = async (r) => { await supabase.from('rooms').update({ is_active: !r.is_active }).eq('id', r.id); load() }
  const del = async (r) => { await supabase.from('rooms').delete().eq('id', r.id); load() }

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-pine mb-3 flex items-center gap-2"><BedDouble size={17} /> Room inventory</h3>
      <div className="grid grid-cols-5 gap-2 mb-4 items-end">
        <div><label className="label">Room no.</label><input className="input" value={n.room_no} onChange={(e) => setN({ ...n, room_no: e.target.value })} /></div>
        <div><label className="label">Room type</label>
          <select className="input" value={n.room_type} onChange={(e) => setN({ ...n, room_type: e.target.value })}>
            {['Standard', 'Deluxe', 'Premium', 'Cottage', 'Villa', 'Suite', 'Family'].map((t) => <option key={t}>{t}</option>)}
          </select></div>
        <div><label className="label">Base rate / night</label><input type="number" className="input money" value={n.base_rate} onChange={(e) => setN({ ...n, base_rate: e.target.value })} /></div>
        <button className="btn-primary justify-center col-span-2" onClick={add}><Plus size={15} /> Add room</button>
      </div>
      <table className="w-full">
        <thead><tr><th className="th">Room</th><th className="th">Type</th><th className="th text-right">Base rate</th><th className="th">Status</th><th className="th"></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold">{r.room_no}</td>
              <td className="td text-sm">{r.room_type}</td>
              <td className="td money text-right">{fmtBDT(r.base_rate)}</td>
              <td className="td">
                <button onClick={() => toggle(r)} className={`status-chip ${r.is_active ? 'bg-forest/15 text-forest' : 'bg-stone-200 text-stone-600'}`}>
                  {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </td>
              <td className="td text-right"><button onClick={() => del(r)} className="text-red-300 hover:text-red-600"><Trash2 size={14} /></button></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="td text-pine/50" colSpan={5}>No rooms yet — add your room inventory to enable check-ins.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
