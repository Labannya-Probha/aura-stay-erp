import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { fmtBDT, fmtDate, todayISO } from '../lib/helpers'
import { generatePayrollJournal, approvePayrollAndPostJv } from '../lib/generatePayrollJournal'
import KPICards from '../components/KPICards.jsx'
import { Users, Plus, Check, X, CalendarDays, FileText, Wallet, Printer } from 'lucide-react'
import PrintPortal from '../components/PrintPortal.jsx'
import ComplianceTab from '../components/ComplianceTab'
import EmployeeProfile from '../components/EmployeeProfile.jsx'
import HrLetterDoc from '../components/print/HrLetterDoc.jsx'
import '../styles/aeds-v6-workspaces.css'
import AedsDataGrid from '../components/data-grid/AedsDataGrid.jsx'

/* ─── shared flash helper ─── */
function useFlash() {
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000) }
  return [msg, flash]
}

/* ─── page wrapper ─── */
function HrPage({ title, subtitle, children }) {
  return (
    <div className="aeds-v6-legacy-page">
      <div className="aeds-v6-legacy-header">
        <div>
          <div className="aeds-v6-workspace-eyebrow">People & Compliance</div>
          <h1 className="flex items-center gap-2">
            <Users className="text-forest" /> {title}
          </h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <span className="aeds-core-badge">HR workspace</span>
      </div>
      {children}
    </div>
  )
}

/* ─── placeholder ─── */
function ComingSoon({ title }) {
  return (
    <div className="card p-10 text-center text-pine/40">
      <div className="text-4xl mb-3">🚧</div>
      <div className="font-semibold text-pine/60">{title}</div>
      <div className="text-sm mt-1">This module is under development.</div>
    </div>
  )
}

/* ================================================================== */
/*  DEFAULT EXPORT — kept for backward compat (not used in new routes) */
/* ================================================================== */
export default function HrOffice({ userName, role, isAdmin, company }) {
  return <HrEmployeeEntryPage userName={userName} role={role} isAdmin={isAdmin} company={company} />
}

/* ================================================================== */
/*  EMPLOYEE MANAGEMENT                                                 */
/* ================================================================== */
export function HrEmployeeEntryPage({ userName, role, isAdmin, company }) {
  const [msg, flash] = useFlash()
  return (
    <HrPage title="Employee Entry" subtitle="Add and manage employee master records.">
      <KPICards module="hr" />
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      <EmployeesTab flash={flash} isAdmin={isAdmin} userName={userName} company={company} />
    </HrPage>
  )
}

export function HrServiceBookPage({ userName, role, isAdmin, company }) {
  return (
    <HrPage title="Service Book Entry" subtitle="Maintain employee service history records.">
      <ComingSoon title="Service Book Entry" />
    </HrPage>
  )
}

export function HrNomineePage({ userName, role, isAdmin, company }) {
  return (
    <HrPage title="Nominee Declaration Entry" subtitle="Record employee nominee / beneficiary declarations.">
      <ComingSoon title="Nominee Declaration Entry" />
    </HrPage>
  )
}

/* ================================================================== */
/*  LEAVE MANAGEMENT                                                    */
/* ================================================================== */
export function HrLeaveEntryPage({ userName, role, isAdmin, company }) {
  const [msg, flash] = useFlash()
  const canApprove = isAdmin || role === 'MANAGER' || role === 'HR'
  return (
    <HrPage title="Leave Entry" subtitle="Apply and approve employee leave requests.">
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      <LeaveTab flash={flash} userName={userName} canApprove={canApprove} />
    </HrPage>
  )
}

export function HrCompLeavePage({ userName, role, isAdmin, company }) {
  const [msg, flash] = useFlash()
  return (
    <HrPage title="Compensatory Leave Management" subtitle="Track and manage compensatory leave earned.">
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      <CompLeaveTab flash={flash} />
    </HrPage>
  )
}

export function HrFestivalLeavePage({ userName, role, isAdmin, company }) {
  return (
    <HrPage title="Festival Leave Management" subtitle="Configure festival / public holiday leave calendar.">
      <ComingSoon title="Festival Leave Management" />
    </HrPage>
  )
}

/* ================================================================== */
/*  PAYROLL MANAGEMENT                                                  */
/* ================================================================== */
export function HrPayrollConfigPage({ userName, role, isAdmin, company }) {
  return (
    <HrPage title="Payroll Configuration" subtitle="Configure salary structure, allowances and deduction rules.">
      <ComingSoon title="Payroll Configuration" />
    </HrPage>
  )
}

export function HrPayrollGenPage({ userName, role, isAdmin, company }) {
  const [msg, flash] = useFlash()
  const canApprove = isAdmin || role === 'MANAGER' || role === 'HR'
  return (
    <HrPage title="Payroll Generation" subtitle="Generate and approve monthly payroll runs.">
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      <PayrollTab flash={flash} userName={userName} canApprove={canApprove} isAdmin={isAdmin} company={company} />
    </HrPage>
  )
}

export function HrPayrollRegisterPage({ userName, role, isAdmin, company }) {
  return (
    <HrPage title="Payroll Register" subtitle="View historical payroll runs and disbursement records.">
      <ComingSoon title="Payroll Register" />
    </HrPage>
  )
}
/* ================================================================== */
/*  HR LETTERS                                                          */
/* ================================================================== */
const LETTER_TYPES = [
  { value: 'OFFER_LETTER',     label: 'Offer Letter',               extraFields: ['joiningDate', 'probation'] },
  { value: 'APPOINTMENT',      label: 'Appointment Letter',         extraFields: ['joiningDate', 'probation'] },
  { value: 'JOINING',          label: 'Joining Letter',             extraFields: ['joiningDate'] },
  { value: 'CONFIRMATION',     label: 'Confirmation Letter',        extraFields: ['joiningDate', 'probation'] },
  { value: 'SALARY_INCREMENT', label: 'Salary Increment Letter',    extraFields: ['purpose'] },
  { value: 'PROMOTION',        label: 'Promotion Letter',           extraFields: ['joiningDate'] },
  { value: 'OBJECTION',        label: 'Objection Letter',           extraFields: ['subject', 'description'] },
  { value: 'SHOW_CAUSE',       label: 'Show Cause Notice',          extraFields: ['incidentDate', 'subject', 'allegation', 'details', 'replyDays'] },
  { value: 'WARNING',          label: 'Warning Letter',             extraFields: ['incidentDate', 'subject', 'description', 'warningNo'] },
  { value: 'RELIEVING',        label: 'Letter of Dismissal/Termination', extraFields: ['lastWorkingDate', 'resignationType'] },
  { value: 'NOC',              label: 'No Objection Certificate',   extraFields: ['purpose'] },
  { value: 'EXP_CERT',         label: 'Experience Certificate',     extraFields: ['lastWorkingDate', 'tenure', 'skills', 'additionalNote'] },
  { value: 'SALARY_CERT',      label: 'Employment Certificate',     extraFields: ['purpose', 'showBreakdown'] },
  { value: 'FINAL_PAYMENT',    label: 'Final Payment Letter',       extraFields: ['lastWorkingDate'] },
]

export function HrLetterPage({ type, company }) {
  const [emps, setEmps]     = useState([])
  const [empId, setEmpId]   = useState('')
  const [date, setDate]     = useState(todayISO())
  const [extra, setExtra]   = useState({})
  const [printDoc, setPrintDoc] = useState(null)
  const [msg, setMsg]       = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  useEffect(() => {
    supabase.from('employees').select('*').order('full_name').then(({ data }) => setEmps(data || []))
  }, [])

  const selectedEmp  = emps.find((e) => e.id === empId) || null
  const selectedType = LETTER_TYPES.find((t) => t.value === type)
  const setE = (k, v) => setExtra((p) => ({ ...p, [k]: v }))

  const openPrint = () => {
    if (!selectedEmp) { flash('Please select an employee.'); return }
    setPrintDoc({ type, employee: selectedEmp, extra, date })
  }

  return (
    <HrPage title={selectedType?.label || 'HR Letter'} subtitle="Generate and print HR correspondence.">
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Employee</label>
            <select className="input" value={empId} onChange={(e) => setEmpId(e.target.value)}>
              <option value="">Select employee…</option>
              {emps.map((e) => <option key={e.id} value={e.id}>{e.full_name} ({e.emp_code})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        {selectedType && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {selectedType.extraFields.includes('joiningDate')        && <div><label className="label">Joining Date</label><input type="date" className="input" value={extra.joiningDate || ''} onChange={(e) => setE('joiningDate', e.target.value)} /></div>}
            {selectedType.extraFields.includes('lastWorkingDate')    && <div><label className="label">Last Working Date</label><input type="date" className="input" value={extra.lastWorkingDate || ''} onChange={(e) => setE('lastWorkingDate', e.target.value)} /></div>}
            {selectedType.extraFields.includes('incidentDate')       && <div><label className="label">Incident Date</label><input type="date" className="input" value={extra.incidentDate || ''} onChange={(e) => setE('incidentDate', e.target.value)} /></div>}
            {selectedType.extraFields.includes('probation')          && <div><label className="label">Probation Period</label><input className="input" placeholder="e.g. 3 months" value={extra.probation || ''} onChange={(e) => setE('probation', e.target.value)} /></div>}
            {selectedType.extraFields.includes('purpose')            && <div><label className="label">Purpose</label><input className="input" placeholder="e.g. bank loan, visa" value={extra.purpose || ''} onChange={(e) => setE('purpose', e.target.value)} /></div>}
            {selectedType.extraFields.includes('tenure')             && <div><label className="label">Tenure</label><input className="input" placeholder="e.g. 2 years 3 months" value={extra.tenure || ''} onChange={(e) => setE('tenure', e.target.value)} /></div>}
            {selectedType.extraFields.includes('replyDays')          && <div><label className="label">Reply Within</label><input className="input" placeholder="e.g. 48 hours" value={extra.replyDays || ''} onChange={(e) => setE('replyDays', e.target.value)} /></div>}
            {selectedType.extraFields.includes('warningNo')          && <div><label className="label">Warning Number</label><select className="input" value={extra.warningNo || '1st'} onChange={(e) => setE('warningNo', e.target.value)}>{['1st','2nd','3rd','Final'].map((v) => <option key={v}>{v}</option>)}</select></div>}
            {selectedType.extraFields.includes('resignationType')    && <div><label className="label">Separation Type</label><select className="input" value={extra.resignationType || 'RESIGNATION'} onChange={(e) => setE('resignationType', e.target.value)}><option value="RESIGNATION">Resignation</option><option value="TERMINATION">Termination</option></select></div>}
            {selectedType.extraFields.includes('showBreakdown')      && <div className="flex items-center gap-2 pt-4"><input type="checkbox" id="showBreakdown" checked={!!extra.showBreakdown} onChange={(e) => setE('showBreakdown', e.target.checked)} /><label htmlFor="showBreakdown" className="text-sm text-pine cursor-pointer">Show salary breakdown</label></div>}
            {selectedType.extraFields.includes('subject')            && <div className="col-span-2"><label className="label">Subject</label><input className="input" placeholder="Brief subject" value={extra.subject || ''} onChange={(e) => setE('subject', e.target.value)} /></div>}
            {selectedType.extraFields.includes('description')        && <div className="col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={extra.description || ''} onChange={(e) => setE('description', e.target.value)} /></div>}
            {selectedType.extraFields.includes('allegation')         && <div className="col-span-2"><label className="label">Allegation</label><input className="input" placeholder="e.g. violated leave policy" value={extra.allegation || ''} onChange={(e) => setE('allegation', e.target.value)} /></div>}
            {selectedType.extraFields.includes('details')            && <div className="col-span-2"><label className="label">Details</label><textarea className="input" rows={2} value={extra.details || ''} onChange={(e) => setE('details', e.target.value)} /></div>}
            {selectedType.extraFields.includes('skills')             && <div className="col-span-2"><label className="label">Skills / Qualities</label><input className="input" placeholder="e.g. excellent communication" value={extra.skills || ''} onChange={(e) => setE('skills', e.target.value)} /></div>}
            {selectedType.extraFields.includes('additionalNote')     && <div className="col-span-2"><label className="label">Additional Note</label><textarea className="input" rows={2} value={extra.additionalNote || ''} onChange={(e) => setE('additionalNote', e.target.value)} /></div>}
          </div>
        )}
        <div className="flex justify-end pt-1">
          <button className="btn-primary" onClick={openPrint}><Printer size={15} /> Preview &amp; Print</button>
        </div>
      </div>
      {printDoc && (
        <PrintPortal title={`${selectedType?.label} — ${printDoc.employee.full_name}`} onClose={() => setPrintDoc(null)}>
          <HrLetterDoc type={printDoc.type} employee={printDoc.employee} extra={printDoc.extra} company={company} date={printDoc.date} />
        </PrintPortal>
      )}
    </HrPage>
  )
}

/* ================================================================== */
/*  REGISTER                                                            */
/* ================================================================== */
export function HrAttendanceRegisterPage({ flash }) {
  return (
    <HrPage title="Attendance Register" subtitle="Daily attendance marking for all active employees.">
      <AttendanceTab flash={flash || (() => {})} />
    </HrPage>
  )
}

export function HrEmployeeRegisterPage({ role }) {
  return (
    <HrPage title="Employee Register (Form-8)" subtitle="Statutory employee register as per Bangladesh Labour Rules.">
      <ComingSoon title="Employee Register (Form-8)" />
    </HrPage>
  )
}

export function HrServiceBookRegPage({ userName }) {
  return (
    <HrPage title="Service Book Register" subtitle="View and print service book records for all employees.">
      <ComingSoon title="Service Book Register" />
    </HrPage>
  )
}

export function HrIncidentsPage({ userName, flash }) {
  return (
    <HrPage title="Incidents Register" subtitle="Log and track workplace incidents and disciplinary actions.">
      <IncidentsTab flash={flash || (() => {})} userName={userName} />
    </HrPage>
  )
}

export function HrCompliancePage({ role }) {
  return (
    <HrPage title="Compliance" subtitle="Bangladesh Labour Law compliance checklists and statutory forms.">
      <ComplianceTab role={role} />
    </HrPage>
  )
}

/* ================================================================== */
/*  INNER TAB COMPONENTS (unchanged from original)                     */
/* ================================================================== */

function EmployeesTab({ flash, isAdmin, userName, company }) {
  const [rows, setRows] = useState([])
  const [viewing, setViewing] = useState(null)
  const [f, setF] = useState({ full_name: '', designation: '', department: '', join_date: todayISO(), phone: '', gross_salary: '' })
  const load = async () => { const { data } = await supabase.from('employees').select('*').order('created_at'); setRows(data || []) }
  useEffect(() => { load() }, [])
  const add = async () => { if (!f.full_name) return; const { error } = await supabase.from('employees').insert({ ...f, gross_salary: +f.gross_salary || 0 }); if (error) flash(error.message); else { setF({ full_name: '', designation: '', department: '', join_date: todayISO(), phone: '', gross_salary: '' }); load() } }
  const setStatus = async (id, status) => { await supabase.from('employees').update({ status }).eq('id', id); load() }

  if (viewing) {
    return <EmployeeProfile employee={viewing} company={company} userName={userName} back={() => setViewing(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <input className="input col-span-2" placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <input className="input" placeholder="Designation" value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} />
        <input className="input" placeholder="Department" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
        <input type="number" className="input money" placeholder="Gross salary" value={f.gross_salary} onChange={(e) => setF({ ...f, gross_salary: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <AedsDataGrid
        title="Employee Register"
        subtitle="Employee master, designation, department and salary status"
        data={rows}
        columns={[
          { accessorKey: 'emp_code', header: 'Code', width: 130 },
          { accessorKey: 'full_name', header: 'Employee', width: 240 },
          { accessorKey: 'designation', header: 'Designation', width: 190 },
          { accessorKey: 'department', header: 'Department', width: 170 },
          { accessorKey: 'join_date', header: 'Joining Date', type: 'date', width: 140 },
          { accessorKey: 'phone', header: 'Phone', width: 150 },
          { accessorKey: 'gross_salary', header: 'Gross Salary', type: 'currency', aggregation: 'sum', width: 160 },
          {
            accessorKey: 'status',
            header: 'Status',
            type: 'status',
            width: 150,
            cell: ({ row }) => (
              isAdmin ? (
                <select
                  className="input !py-1 !w-32"
                  value={row.status}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => setStatus(row.id, event.target.value)}
                >
                  {['ACTIVE', 'RESIGNED', 'TERMINATED'].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              ) : row.status
            ),
          },
        ]}
        pageSize={100}
        emptyText="No employees yet."
        getRowId={(row) => row.id}
        onRowClick={(row) => setViewing(row)}
      />
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
      <AedsDataGrid
        title="Daily Attendance"
        subtitle={`Attendance marking for ${fmtDate(date)}`}
        data={emps.map((employee) => ({
          ...employee,
          attendance_status: recs[employee.id] || 'UNMARKED',
        }))}
        columns={[
          { accessorKey: 'emp_code', header: 'Code', width: 130 },
          { accessorKey: 'full_name', header: 'Employee', width: 260 },
          { accessorKey: 'department', header: 'Department', width: 170 },
          { accessorKey: 'designation', header: 'Designation', width: 190 },
          { accessorKey: 'attendance_status', header: 'Status', type: 'status', width: 150 },
          {
            accessorKey: 'mark',
            header: 'Mark Attendance',
            sortable: false,
            width: 330,
            cell: ({ row }) => (
              <div className="flex gap-1 flex-wrap">
                {STAT.map(([status, label]) => (
                  <button
                    key={status}
                    onClick={(event) => {
                      event.stopPropagation()
                      mark(row.id, status)
                    }}
                    title={label}
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      recs[row.id] === status
                        ? status === 'A'
                          ? 'bg-red-500 text-white'
                          : 'bg-forest text-white'
                        : 'bg-leaf/50 text-pine/70 hover:bg-leaf'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            ),
          },
        ]}
        pageSize={100}
        emptyText="No active employees."
        getRowId={(row) => row.id}
      />
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
      <AedsDataGrid
        title="Leave Applications"
        subtitle="Leave request, entitlement balance and approval workflow"
        data={rows.map((row) => ({
          ...row,
          employee_name: row.employees?.full_name || '—',
          leave_type_name: row.leave_types?.name || '—',
          leave_period: `${fmtDate(row.from_date)} → ${fmtDate(row.to_date)}`,
          balance:
            (Number(row.leave_types?.annual_days) || 0) -
            taken(row.employee_id, row.leave_type_id),
        }))}
        columns={[
          { accessorKey: 'employee_name', header: 'Employee', width: 240 },
          { accessorKey: 'leave_type_name', header: 'Leave Type', width: 170 },
          { accessorKey: 'leave_period', header: 'Period', width: 230 },
          { accessorKey: 'days', header: 'Days', type: 'number', aggregation: 'sum', width: 100 },
          { accessorKey: 'balance', header: 'Balance', type: 'number', width: 110 },
          { accessorKey: 'reason', header: 'Reason', width: 280 },
          { accessorKey: 'status', header: 'Status', type: 'status', width: 140 },
          {
            accessorKey: 'actions',
            header: 'Actions',
            sortable: false,
            width: 150,
            cell: ({ row }) => (
              row.status === 'PENDING' && canApprove ? (
                <div className="flex gap-2">
                  <button
                    className="text-forest"
                    onClick={(event) => {
                      event.stopPropagation()
                      setStatus(row.id, 'APPROVED')
                    }}
                    title="Approve"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    className="text-red-500"
                    onClick={(event) => {
                      event.stopPropagation()
                      setStatus(row.id, 'REJECTED')
                    }}
                    title="Reject"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : null
            ),
          },
        ]}
        pageSize={100}
        emptyText="No leave applications."
        getRowId={(row) => row.id}
      />
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
      <AedsDataGrid
        title="Compensatory Leave Register"
        subtitle="Earned leave, usage status and available balance"
        data={rows.map((row) => ({
          ...row,
          employee_name: row.employees?.full_name || '—',
          usage_status: row.used ? 'USED' : 'AVAILABLE',
        }))}
        columns={[
          { accessorKey: 'employee_name', header: 'Employee', width: 240 },
          { accessorKey: 'earned_date', header: 'Earned Date', type: 'date', width: 140 },
          { accessorKey: 'days', header: 'Days', type: 'number', aggregation: 'sum', width: 100 },
          { accessorKey: 'reason', header: 'Reason', width: 300 },
          { accessorKey: 'used_date', header: 'Used Date', type: 'date', width: 140 },
          {
            accessorKey: 'usage_status',
            header: 'Status',
            type: 'status',
            width: 150,
            cell: ({ row }) => (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  toggle(row)
                }}
                className={`status-chip ${
                  row.used
                    ? 'bg-stone-200 text-stone-700'
                    : 'bg-forest/15 text-forest'
                }`}
              >
                {row.used ? 'USED' : 'AVAILABLE'}
              </button>
            ),
          },
        ]}
        pageSize={100}
        emptyText="No compensatory leave recorded."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

const BASIC_PCT_OF_GROSS = 0.48
const SPLIT_OF_BASIC = { house_rent: 0.50, conveyance: 0.35, medical: 0.20 }
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function PayrollTab({ flash, userName, canApprove, isAdmin, company }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [runs, setRuns] = useState([])
  const [runsLoaded, setRunsLoaded] = useState(false)
  const [active, setActive] = useState(null)
  const [slips, setSlips] = useState([])
  const [busy, setBusy] = useState(false)
  const [printSlip, setPrintSlip] = useState(null)

  const loadRuns = async () => {
    const { data } = await supabase.from('payroll_runs').select('*').order('period_year', { ascending: false }).order('period_month', { ascending: false })
    setRuns(data || [])
  }
  useEffect(() => { loadRuns() }, [])

  const loadSlips = async (runId) => {
    const { data } = await supabase.from('payslips').select('*').eq('payroll_run_id', runId).order('full_name')
    setSlips(data || [])
  }
  const openRun = async (run) => { setActive(run); await loadSlips(run.id) }

  const generateRun = async ({ silent = false } = {}) => {
    setBusy(true)
    try {
      const { data: existing } = await supabase.from('payroll_runs').select('id').eq('period_month', month).eq('period_year', year).maybeSingle()
      if (existing) { flash(`Payroll for ${MONTH_NAMES[month - 1]} ${year} already exists — open it below to review.`); setBusy(false); return }
      const { data: run, error: re } = await supabase.from('payroll_runs').insert({ period_month: month, period_year: year, generated_by: userName }).select().single()
      if (re) throw re
      const [{ data: emps }, { data: allowances }] = await Promise.all([
        supabase.from('employees').select('*').eq('status', 'ACTIVE'),
        supabase.from('allowance_config').select('*').eq('is_active', true).eq('allowance_name', 'Internet/Telephone Allowance'),
      ])
      const allowanceMap = Object.fromEntries((allowances || []).map((a) => [a.designation, +a.amount]))
      const periodStart = `${year}-${String(month).padStart(2, '0')}-01`
      const periodEnd   = `${year}-${String(month).padStart(2, '0')}-31`
      const slipsToInsert = []
      for (const e of emps || []) {
        const { count } = await supabase.from('attendance_records').select('*', { count: 'exact', head: true }).eq('employee_id', e.id).eq('status', 'A').gte('att_date', periodStart).lte('att_date', periodEnd)
        const absentDays = count || 0
        const gross = +e.gross_salary || 0
        const basic = +(gross * BASIC_PCT_OF_GROSS).toFixed(2)
        const houseRent = +(basic * SPLIT_OF_BASIC.house_rent).toFixed(2)
        const conveyance = +(basic * SPLIT_OF_BASIC.conveyance).toFixed(2)
        const medical = +(basic * SPLIT_OF_BASIC.medical).toFixed(2)
        const internetAllowance = allowanceMap[e.designation] ?? allowanceMap['DEFAULT'] ?? 0
        const perDay = gross / 30
        const absentDeduction = +(perDay * absentDays).toFixed(2)
        const netPayable = +(gross - absentDeduction).toFixed(2)
        slipsToInsert.push({ payroll_run_id: run.id, employee_id: e.id, emp_code: e.emp_code, full_name: e.full_name, designation: e.designation, department: e.department, gross_salary: gross, basic, house_rent: houseRent, medical, conveyance, internet_allowance: internetAllowance, other_allowance: 0, absent_days: absentDays, absent_deduction: absentDeduction, advance_deduction: 0, other_deduction: 0, net_payable: netPayable })
      }
      if (slipsToInsert.length === 0) { if (!silent) flash('No active employees to run payroll for.'); setBusy(false); return }
      const { error: se } = await supabase.from('payslips').insert(slipsToInsert)
      if (se) throw se
      await loadRuns(); await openRun(run)
      flash(`Payroll generated for ${MONTH_NAMES[month - 1]} ${year} — ${slipsToInsert.length} payslip(s).`)
    } catch (e) { flash(e.message) }
    setBusy(false)
  }

  useEffect(() => {
    if (!canApprove || !runsLoaded || busy) return
    const exists = runs.some((r) => r.period_month === month && r.period_year === year)
    if (!exists) generateRun({ silent: true })
  }, [canApprove, runsLoaded, runs, month, year])

  const updateSlip = async (slip, field, value) => {
    const n = { ...slip, [field]: value }
    n.net_payable = +(+n.gross_salary - +n.absent_deduction - (+n.advance_deduction || 0) - (+n.other_deduction || 0) + (+n.other_allowance || 0)).toFixed(2)
    setSlips((prev) => prev.map((s) => s.id === slip.id ? n : s))
    const { error } = await supabase.from('payslips').update({ [field]: value, net_payable: n.net_payable }).eq('id', slip.id)
    if (error) flash(error.message)
  }

  const approveRun = async () => {
    if (!window.confirm(`Approve payroll for ${MONTH_NAMES[active.period_month - 1]} ${active.period_year}?`)) return
    try {
      const jvId = await approvePayrollAndPostJv(active.id)
      flash(`Payroll approved and journal ${jvId ? 'posted' : 'generated'}.`)
    } catch (e) { flash(e.message); return }
    await loadRuns(); setActive((a) => ({ ...a, status: 'APPROVED' }))
  }

  const markPaid = async () => {
    if (!window.confirm('Mark this payroll run as PAID?')) return
    const { error } = await supabase.from('payroll_runs').update({ status: 'PAID', paid_at: new Date().toISOString() }).eq('id', active.id)
    if (error) { flash(error.message); return }
    await supabase.from('payslips').update({ paid_at: new Date().toISOString() }).eq('payroll_run_id', active.id)
    await loadRuns(); setActive((a) => ({ ...a, status: 'PAID' }))
    flash('Payroll marked as paid.')
  }

  const totalNet = slips.reduce((a, s) => a + (+s.net_payable || 0), 0)

  if (active) {
    const locked = active.status !== 'DRAFT'
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button className="btn-ghost !py-1" onClick={() => setActive(null)}>← All runs</button>
            <h3 className="font-display font-semibold text-pine flex items-center gap-2"><Wallet size={16} className="text-forest" /> {MONTH_NAMES[active.period_month - 1]} {active.period_year}</h3>
            <span className={`status-chip ${active.status === 'PAID' ? 'bg-forest/15 text-forest' : active.status === 'APPROVED' ? 'bg-amber/20 text-amber' : 'bg-stone-200 text-stone-700'}`}>{active.status}</span>
          </div>
          <div className="flex gap-2">
            {canApprove && active.status === 'DRAFT' && <button className="btn-primary !py-1.5" onClick={approveRun}><Check size={14} /> Approve</button>}
            {isAdmin && active.status === 'APPROVED' && <button className="btn-amber !py-1.5" onClick={markPaid}><Wallet size={14} /> Mark paid</button>}
          </div>
        </div>
        {locked && <div className="px-4 py-2 rounded-lg bg-amber/10 text-amber text-sm">This run is {active.status.toLowerCase()} — amounts are locked.</div>}
        <AedsDataGrid
          title="Payroll Register"
          subtitle={`${MONTH_NAMES[active.period_month - 1]} ${active.period_year} · Net payable ${fmtBDT(totalNet)}`}
          data={slips}
          columns={[
            { accessorKey: 'emp_code', header: 'Code', width: 120 },
            { accessorKey: 'full_name', header: 'Employee', width: 230 },
            { accessorKey: 'department', header: 'Department', width: 160 },
            { accessorKey: 'designation', header: 'Designation', width: 180 },
            { accessorKey: 'gross_salary', header: 'Gross', type: 'currency', aggregation: 'sum', width: 150 },
            { accessorKey: 'basic', header: 'Basic', type: 'currency', aggregation: 'sum', width: 140 },
            { accessorKey: 'house_rent', header: 'House Rent', type: 'currency', aggregation: 'sum', width: 150 },
            { accessorKey: 'conveyance', header: 'Transport', type: 'currency', aggregation: 'sum', width: 140 },
            { accessorKey: 'medical', header: 'Medical', type: 'currency', aggregation: 'sum', width: 140 },
            { accessorKey: 'internet_allowance', header: 'Internet', type: 'currency', aggregation: 'sum', width: 140 },
            { accessorKey: 'absent_days', header: 'Absent Days', type: 'number', aggregation: 'sum', width: 120 },
            { accessorKey: 'absent_deduction', header: 'Absent Ded.', type: 'currency', aggregation: 'sum', width: 150 },
            {
              accessorKey: 'advance_deduction',
              header: 'Advance Ded.',
              width: 160,
              cell: ({ row }) => (
                locked ? fmtBDT(row.advance_deduction) : (
                  <input
                    type="number"
                    className="input !w-24 !py-1 money text-right"
                    defaultValue={row.advance_deduction}
                    onClick={(event) => event.stopPropagation()}
                    onBlur={(event) => updateSlip(row, 'advance_deduction', +event.target.value || 0)}
                  />
                )
              ),
            },
            {
              accessorKey: 'other_deduction',
              header: 'Other Ded.',
              width: 150,
              cell: ({ row }) => (
                locked ? fmtBDT(row.other_deduction) : (
                  <input
                    type="number"
                    className="input !w-24 !py-1 money text-right"
                    defaultValue={row.other_deduction}
                    onClick={(event) => event.stopPropagation()}
                    onBlur={(event) => updateSlip(row, 'other_deduction', +event.target.value || 0)}
                  />
                )
              ),
            },
            { accessorKey: 'net_payable', header: 'Net Payable', type: 'currency', aggregation: 'sum', width: 170 },
            {
              accessorKey: 'print',
              header: 'Print',
              sortable: false,
              width: 90,
              cell: ({ row }) => (
                <button
                  className="btn-ghost !py-1"
                  onClick={(event) => {
                    event.stopPropagation()
                    setPrintSlip(row)
                  }}
                >
                  <Printer size={13} />
                </button>
              ),
            },
          ]}
          pageSize={100}
          emptyText="No payslips in this run."
          getRowId={(row) => row.id}
        />
        {printSlip && <PrintPortal title={`Payslip — ${printSlip.full_name}`} onClose={() => setPrintSlip(null)}><PayslipDoc slip={printSlip} run={active} company={company} /></PrintPortal>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-end gap-3 flex-wrap">
        <div><label className="label">Month</label><select className="input !w-40" value={month} onChange={(e) => setMonth(+e.target.value)}>{MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></div>
        <div><label className="label">Year</label><input type="number" className="input !w-28 money" value={year} onChange={(e) => setYear(+e.target.value)} /></div>
        {canApprove && <button className="btn-primary" disabled={busy} onClick={generateRun}><Wallet size={15} /> {busy ? 'Generating…' : 'Generate payroll'}</button>}
      </div>
      <AedsDataGrid
        title="Payroll Runs"
        subtitle="Monthly payroll generation, approval and payment status"
        data={runs.map((run) => ({
          ...run,
          period_label: `${MONTH_NAMES[run.period_month - 1]} ${run.period_year}`,
        }))}
        columns={[
          { accessorKey: 'period_label', header: 'Period', width: 180 },
          { accessorKey: 'status', header: 'Status', type: 'status', width: 140 },
          { accessorKey: 'generated_by', header: 'Generated By', width: 190 },
          { accessorKey: 'created_at', header: 'Created At', type: 'date', width: 140 },
          {
            accessorKey: 'open',
            header: 'Open',
            sortable: false,
            width: 110,
            cell: ({ row }) => (
              <button
                className="btn-ghost !py-1"
                onClick={(event) => {
                  event.stopPropagation()
                  openRun(row)
                }}
              >
                Open →
              </button>
            ),
          },
        ]}
        pageSize={60}
        emptyText="No payroll runs yet."
        getRowId={(row) => row.id}
        onRowClick={(row) => openRun(row)}
      />
    </div>
  )
}

function PayslipDoc({ slip, run, company }) {
  const primary = 'var(--print-primary, #1B4D2E)'
  const accent  = 'var(--print-accent, #2E7D32)'
  const cell = { border: '1px solid #000', padding: '6px 8px', fontSize: 11, verticalAlign: 'top' }
  const rt   = { ...cell, textAlign: 'right', fontFamily: '"IBM Plex Mono", monospace' }
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', color: '#000' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `2px solid ${primary}`, paddingBottom: 8, marginBottom: 12 }}>
        {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 50, width: 50, objectFit: 'contain' }} />}
        <div style={{ flex: 1, textAlign: company?.logo_url ? 'left' : 'center' }}>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'Fraunces, serif', color: primary }}>{company?.name || 'Resort'}</div>
          <div style={{ fontSize: 10.5 }}>{company?.address}</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textDecoration: 'underline' }}>PAYSLIP — {String(run.period_month).padStart(2, '0')}/{run.period_year}</div>
      <table style={{ width: '100%', fontSize: 11, marginBottom: 10 }}><tbody>
        <tr><td><b>Employee:</b> {slip.full_name}</td><td style={{ textAlign: 'right' }}><b>Code:</b> {slip.emp_code}</td></tr>
        <tr><td><b>Designation:</b> {slip.designation || '—'}</td><td style={{ textAlign: 'right' }}><b>Department:</b> {slip.department || '—'}</td></tr>
      </tbody></table>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#eee' }}><th style={cell}>Salary Breakdown</th><th style={{ ...cell, textAlign: 'right' }}>Amount</th><th style={cell}>Deductions</th><th style={{ ...cell, textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          <tr><td style={cell}>Basic</td><td style={rt}>{fmtBDT(slip.basic)}</td><td style={cell}>Absent ({slip.absent_days} day(s))</td><td style={rt}>{fmtBDT(slip.absent_deduction)}</td></tr>
          <tr><td style={cell}>House Rent</td><td style={rt}>{fmtBDT(slip.house_rent)}</td><td style={cell}>Advance</td><td style={rt}>{fmtBDT(slip.advance_deduction)}</td></tr>
          <tr><td style={cell}>Transportation</td><td style={rt}>{fmtBDT(slip.conveyance)}</td><td style={cell}>Other</td><td style={rt}>{fmtBDT(slip.other_deduction)}</td></tr>
          <tr><td style={cell}>Medical Allowance</td><td style={rt}>{fmtBDT(slip.medical)}</td><td style={cell}></td><td style={rt}></td></tr>
          <tr><td style={cell}>Internet/Telephone</td><td style={rt}>{fmtBDT(slip.internet_allowance)}</td><td style={cell}></td><td style={rt}></td></tr>
          {+slip.other_allowance > 0 && <tr><td style={cell}>Other allowance</td><td style={rt}>{fmtBDT(slip.other_allowance)}</td><td style={cell}></td><td style={rt}></td></tr>}
        </tbody>
        <tfoot><tr style={{ fontWeight: 700, background: '#f5f5f5' }}><td style={cell}>Gross</td><td style={rt}>{fmtBDT(slip.gross_salary)}</td><td style={cell}>Total deduction</td><td style={rt}>{fmtBDT(+slip.absent_deduction + +slip.advance_deduction + +slip.other_deduction)}</td></tr></tfoot>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#fff', background: accent, padding: '8px 12px', borderRadius: 6, margin: '10px 0' }}>
        <span>NET PAYABLE</span><span>{fmtBDT(slip.net_payable)}</span>
      </div>
      <table style={{ width: '100%', marginTop: 40, fontSize: 11 }}><tbody><tr>
        <td style={{ width: '45%', borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>Employee Signature</td>
        <td style={{ width: '10%' }}></td>
        <td style={{ width: '45%', borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>Authorized Signature</td>
      </tr></tbody></table>
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
      <AedsDataGrid
        title="Incident Register"
        subtitle="Employee incidents, action taken and resolution status"
        data={rows}
        columns={[
          { accessorKey: 'incident_date', header: 'Date', type: 'date', width: 140 },
          { accessorKey: 'category', header: 'Category', width: 150 },
          { accessorKey: 'description', header: 'Description', width: 320 },
          { accessorKey: 'action_taken', header: 'Action Taken', width: 260 },
          { accessorKey: 'reported_by', header: 'Reported By', width: 170 },
          {
            accessorKey: 'status',
            header: 'Status',
            type: 'status',
            width: 130,
            cell: ({ row }) => (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  toggle(row)
                }}
                className={`status-chip ${
                  row.status === 'OPEN'
                    ? 'bg-amber/20 text-amber'
                    : 'bg-forest/15 text-forest'
                }`}
              >
                {row.status}
              </button>
            ),
          },
        ]}
        pageSize={100}
        emptyText="No incidents logged."
        getRowId={(row) => row.id}
      />
    </div>
  )
}
