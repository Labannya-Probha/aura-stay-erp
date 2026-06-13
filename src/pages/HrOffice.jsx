import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { fmtBDT, fmtDate, todayISO } from '../lib/helpers'
import { Users, Plus, Check, X, CalendarDays, FileText } from 'lucide-react'

const TABS = ['Employees', 'Attendance', 'Leave', 'Comp Leave', 'Incidents', 'Letters / Docket']

export default function HrOffice({ userName, role, isAdmin, company }) {
  const [tab, setTab] = useState('Employees')
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000) }
  const canApprove = isAdmin || role === 'MANAGER' || role === 'HR'
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-pine flex items-center gap-2"><Users className="text-forest" /> HR & Office</h1>
        <p className="text-sm text-pine/60">Employee records, attendance, leave, incidents and the office document register.</p>
      </div>
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      <div className="flex gap-1 border-b border-leaf flex-wrap">
        {TABS.map((t) => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold rounded-t-lg ${tab === t ? 'bg-white border border-leaf border-b-white text-forest -mb-px' : 'text-pine/60 hover:text-pine'}`}>{t}</button>))}
      </div>
      {tab === 'Employees' && <EmployeesTab flash={flash} isAdmin={isAdmin} />}
      {tab === 'Attendance' && <AttendanceTab flash={flash} />}
      {tab === 'Leave' && <LeaveTab flash={flash} userName={userName} canApprove={canApprove} />}
      {tab === 'Comp Leave' && <CompLeaveTab flash={flash} />}
      {tab === 'Incidents' && <IncidentsTab flash={flash} userName={userName} />}
      {tab === 'Letters / Docket' && <DocketTab flash={flash} userName={userName} />}
    </div>
  )
}

function EmployeesTab({ flash, isAdmin }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ full_name: '', designation: '', department: '', join_date: todayISO(), phone: '', gross_salary: '' })
  const load = async () => { const { data } = await supabase.from('employees').select('*').order('created_at'); setRows(data || []) }
  useEffect(() => { load() }, [])
  const add = async () => { if (!f.full_name) return; const { error } = await supabase.from('employees').insert({ ...f, gross_salary: +f.gross_salary || 0 }); if (error) flash(error.message); else { setF({ full_name: '', designation: '', department: '', join_date: todayISO(), phone: '', gross_salary: '' }); load() } }
  const setStatus = async (id, status) => { await supabase.from('employees').update({ status }).eq('id', id); load() }
  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <input className="input col-span-2" placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <input className="input" placeholder="Designation" value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} />
        <input className="input" placeholder="Department" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
        <input type="number" className="input money" placeholder="Gross salary" value={f.gross_salary} onChange={(e) => setF({ ...f, gross_salary: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Code</th><th className="th">Name</th><th className="th">Designation</th><th className="th">Dept</th><th className="th text-right">Gross</th><th className="th">Status</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="td money text-xs">{e.emp_code}</td><td className="td text-sm font-medium">{e.full_name}</td>
                <td className="td text-sm">{e.designation || '—'}</td><td className="td text-xs">{e.department || '—'}</td>
                <td className="td money text-right">{fmtBDT(e.gross_salary)}</td>
                <td className="td">{isAdmin ? <select className="input !py-1 !w-32" value={e.status} onChange={(ev) => setStatus(e.id, ev.target.value)}>{['ACTIVE', 'RESIGNED', 'TERMINATED'].map((s) => <option key={s}>{s}</option>)}</select> : <span className={`status-chip ${e.status === 'ACTIVE' ? 'bg-forest/15 text-forest' : 'bg-stone-200 text-stone-700'}`}>{e.status}</span>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={6}>No employees yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AttendanceTab({ flash }) {
  const [emps, setEmps] = useState([])
  const [date, setDate] = useState(todayISO())
  const [recs, setRecs] = useState({})
  const load = async () => {
    const [{ data: e }, { data: a }] = await Promise.all([
      supabase.from('employees').select('*').eq('status', 'ACTIVE').order('full_name'),
      supabase.from('attendance_records').select('*').eq('att_date', date),
    ])
    setEmps(e || [])
    setRecs(Object.fromEntries((a || []).map((r) => [r.employee_id, r.status])))
  }
  useEffect(() => { load() }, [date])
  const mark = async (empId, status) => {
    setRecs((p) => ({ ...p, [empId]: status }))
    const { error } = await supabase.from('attendance_records').upsert({ employee_id: empId, att_date: date, status }, { onConflict: 'employee_id,att_date' })
    if (error) flash(error.message)
  }
  const STAT = [['P', 'Present'], ['A', 'Absent'], ['L', 'Leave'], ['H', 'Holiday'], ['OFF', 'Off']]
  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3"><CalendarDays size={16} className="text-forest" /><span className="label !mb-0">Date</span><input type="date" className="input !w-44" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Code</th><th className="th">Employee</th><th className="th">Mark</th></tr></thead>
          <tbody>
            {emps.map((e) => (
              <tr key={e.id}>
                <td className="td money text-xs">{e.emp_code}</td><td className="td text-sm font-medium">{e.full_name}</td>
                <td className="td"><div className="flex gap-1">{STAT.map(([s, label]) => (<button key={s} onClick={() => mark(e.id, s)} title={label} className={`px-2.5 py-1 rounded text-xs font-bold ${recs[e.id] === s ? (s === 'A' ? 'bg-red-500 text-white' : 'bg-forest text-white') : 'bg-leaf/50 text-pine/70 hover:bg-leaf'}`}>{s}</button>))}</div></td>
              </tr>
            ))}
            {emps.length === 0 && <tr><td className="td text-pine/40" colSpan={3}>No active employees.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LeaveTab({ flash, userName, canApprove }) {
  const [emps, setEmps] = useState([]); const [types, setTypes] = useState([]); const [rows, setRows] = useState([])
  const [f, setF] = useState({ employee_id: '', leave_type_id: '', from_date: todayISO(), to_date: todayISO(), reason: '' })
  const load = async () => {
    const [{ data: e }, { data: t }, { data: la }] = await Promise.all([
      supabase.from('employees').select('id, full_name, emp_code').eq('status', 'ACTIVE').order('full_name'),
      supabase.from('leave_types').select('*').order('name'),
      supabase.from('leave_applications').select('*, employees(full_name), leave_types(name, annual_days)').order('applied_at', { ascending: false }),
    ])
    setEmps(e || []); setTypes(t || []); setRows(la || [])
  }
  useEffect(() => { load() }, [])
  const days = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1)
  const apply = async () => {
    if (!f.employee_id || !f.leave_type_id) { flash('Pick employee and leave type.'); return }
    const { error } = await supabase.from('leave_applications').insert({ ...f, days: days(f.from_date, f.to_date) })
    if (error) flash(error.message); else { setF({ employee_id: '', leave_type_id: '', from_date: todayISO(), to_date: todayISO(), reason: '' }); load() }
  }
  const setStatus = async (id, status) => { await supabase.from('leave_applications').update({ status, approved_by: userName, approved_at: new Date().toISOString() }).eq('id', id); load() }
  const taken = (empId, typeId) => rows.filter((r) => r.employee_id === empId && r.leave_type_id === typeId && r.status === 'APPROVED').reduce((a, r) => a + +r.days, 0)
  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <select className="input col-span-2" value={f.employee_id} onChange={(e) => setF({ ...f, employee_id: e.target.value })}><option value="">Employee…</option>{emps.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
        <select className="input" value={f.leave_type_id} onChange={(e) => setF({ ...f, leave_type_id: e.target.value })}><option value="">Type…</option>{types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <input type="date" className="input" value={f.from_date} onChange={(e) => setF({ ...f, from_date: e.target.value })} />
        <input type="date" className="input" value={f.to_date} onChange={(e) => setF({ ...f, to_date: e.target.value })} />
        <button className="btn-primary justify-center" onClick={apply}><Plus size={15} /> Apply</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Employee</th><th className="th">Type</th><th className="th">From → To</th><th className="th text-right">Days</th><th className="th text-right">Balance</th><th className="th">Status</th><th className="th"></th></tr></thead>
          <tbody>
            {rows.map((r) => { const bal = (+r.leave_types?.annual_days || 0) - taken(r.employee_id, r.leave_type_id); return (
              <tr key={r.id}>
                <td className="td text-sm">{r.employees?.full_name}</td><td className="td text-xs">{r.leave_types?.name}</td>
                <td className="td money text-xs">{fmtDate(r.from_date)} → {fmtDate(r.to_date)}</td><td className="td money text-right">{r.days}</td>
                <td className="td money text-right">{bal}</td>
                <td className="td"><span className={`status-chip ${r.status === 'APPROVED' ? 'bg-forest/15 text-forest' : r.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber/20 text-amber'}`}>{r.status}</span></td>
                <td className="td">{r.status === 'PENDING' && canApprove && (<div className="flex gap-1"><button className="text-forest" onClick={() => setStatus(r.id, 'APPROVED')}><Check size={15} /></button><button className="text-red-500" onClick={() => setStatus(r.id, 'REJECTED')}><X size={15} /></button></div>)}</td>
              </tr>) })}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={7}>No leave applications.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CompLeaveTab({ flash }) {
  const [emps, setEmps] = useState([]); const [rows, setRows] = useState([])
  const [f, setF] = useState({ employee_id: '', earned_date: todayISO(), days: 1, reason: '' })
  const load = async () => {
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from('employees').select('id, full_name').eq('status', 'ACTIVE').order('full_name'),
      supabase.from('comp_leave_register').select('*, employees(full_name)').order('earned_date', { ascending: false }),
    ])
    setEmps(e || []); setRows(c || [])
  }
  useEffect(() => { load() }, [])
  const add = async () => { if (!f.employee_id) return; const { error } = await supabase.from('comp_leave_register').insert({ ...f, days: +f.days }); if (error) flash(error.message); else { setF({ employee_id: '', earned_date: todayISO(), days: 1, reason: '' }); load() } }
  const toggle = async (r) => { await supabase.from('comp_leave_register').update({ used: !r.used, used_date: !r.used ? todayISO() : null }).eq('id', r.id); load() }
  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-5 gap-2">
        <select className="input col-span-2" value={f.employee_id} onChange={(e) => setF({ ...f, employee_id: e.target.value })}><option value="">Employee…</option>{emps.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
        <input type="date" className="input" value={f.earned_date} onChange={(e) => setF({ ...f, earned_date: e.target.value })} />
        <input className="input" placeholder="Reason (worked on holiday)" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Earn</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Employee</th><th className="th">Earned</th><th className="th text-right">Days</th><th className="th">Reason</th><th className="th">Used</th></tr></thead>
          <tbody>
            {rows.map((r) => (<tr key={r.id}><td className="td text-sm">{r.employees?.full_name}</td><td className="td money text-xs">{fmtDate(r.earned_date)}</td><td className="td money text-right">{r.days}</td><td className="td text-xs">{r.reason || '—'}</td><td className="td"><button onClick={() => toggle(r)} className={`status-chip ${r.used ? 'bg-stone-200 text-stone-700' : 'bg-forest/15 text-forest'}`}>{r.used ? `Used ${r.used_date ? fmtDate(r.used_date) : ''}` : 'Available'}</button></td></tr>))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={5}>No compensatory leave recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IncidentsTab({ flash, userName }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ incident_date: todayISO(), category: 'GENERAL', description: '', action_taken: '' })
  const load = async () => { const { data } = await supabase.from('incident_register').select('*').order('incident_date', { ascending: false }); setRows(data || []) }
  useEffect(() => { load() }, [])
  const add = async () => { if (!f.description) return; const { error } = await supabase.from('incident_register').insert({ ...f, reported_by: userName }); if (error) flash(error.message); else { setF({ incident_date: todayISO(), category: 'GENERAL', description: '', action_taken: '' }); load() } }
  const toggle = async (r) => { await supabase.from('incident_register').update({ status: r.status === 'OPEN' ? 'CLOSED' : 'OPEN' }).eq('id', r.id); load() }
  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <input type="date" className="input" value={f.incident_date} onChange={(e) => setF({ ...f, incident_date: e.target.value })} />
        <input className="input" placeholder="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
        <input className="input col-span-2" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <input className="input" placeholder="Action taken" value={f.action_taken} onChange={(e) => setF({ ...f, action_taken: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Log</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Date</th><th className="th">Category</th><th className="th">Description</th><th className="th">Action</th><th className="th">By</th><th className="th">Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (<tr key={r.id}><td className="td money text-xs">{fmtDate(r.incident_date)}</td><td className="td text-xs">{r.category}</td><td className="td text-sm">{r.description}</td><td className="td text-xs">{r.action_taken || '—'}</td><td className="td text-xs">{r.reported_by}</td><td className="td"><button onClick={() => toggle(r)} className={`status-chip ${r.status === 'OPEN' ? 'bg-amber/20 text-amber' : 'bg-forest/15 text-forest'}`}>{r.status}</button></td></tr>))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={6}>No incidents logged.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DocketTab({ flash, userName }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ doc_date: todayISO(), department: 'GEN', doc_type: 'LETTER', subject: '', party: '' })
  const load = async () => { const { data } = await supabase.from('doc_register').select('*').order('created_at', { ascending: false }); setRows(data || []) }
  useEffect(() => { load() }, [])
  const add = async () => { if (!f.subject) return; const { error } = await supabase.from('doc_register').insert({ ...f, created_by: userName }); if (error) flash(error.message); else { setF({ doc_date: todayISO(), department: 'GEN', doc_type: 'LETTER', subject: '', party: '' }); load() } }
  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <input type="date" className="input" value={f.doc_date} onChange={(e) => setF({ ...f, doc_date: e.target.value })} />
        <input className="input" placeholder="Dept" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
        <select className="input" value={f.doc_type} onChange={(e) => setF({ ...f, doc_type: e.target.value })}>{['LETTER', 'MEMO', 'NOTICE', 'CIRCULAR', 'INWARD', 'OUTWARD'].map((t) => <option key={t}>{t}</option>)}</select>
        <input className="input" placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        <input className="input" placeholder="Party" value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><FileText size={15} /> Register</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Docket No</th><th className="th">Date</th><th className="th">Type</th><th className="th">Subject</th><th className="th">Party</th></tr></thead>
          <tbody>
            {rows.map((r) => (<tr key={r.id}><td className="td money text-xs font-semibold">{r.doc_no}</td><td className="td money text-xs">{fmtDate(r.doc_date)}</td><td className="td text-xs">{r.doc_type}</td><td className="td text-sm">{r.subject}</td><td className="td text-xs">{r.party || '—'}</td></tr>))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={5}>No documents registered.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
