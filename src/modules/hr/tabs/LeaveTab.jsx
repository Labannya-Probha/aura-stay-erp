import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { fmtDate, todayISO } from '../../../lib/helpers'
import { Plus, Check, X } from 'lucide-react'
import ModuleDataTable from 'src/components/shared/ModuleDataTable'
import ModuleStatusPill from 'src/components/shared/ModuleStatusPill'

const LEAVE_STATUS_TONES = {
  APPROVED: 'success',
  REJECTED: 'danger',
  PENDING: 'warning',
}

const COMP_LEAVE_TONES = {
  AVAILABLE: 'success',
  USED: 'neutral',
}

function LeaveApplications({ flash, userName, canApprove }) {
  const [emps, setEmps] = useState([])
  const [types, setTypes] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState({
    employee_id: '',
    leave_type_id: '',
    from_date: todayISO(),
    to_date: todayISO(),
    reason: '',
  })

  const load = async () => {
    setLoading(true)
    const [{ data: e }, { data: t }, { data: la }] = await Promise.all([
      supabase
        .from('employees')
        .select('id, full_name, emp_code')
        .eq('status', 'ACTIVE')
        .order('full_name'),
      supabase.from('leave_types').select('*').order('name'),
      supabase
        .from('leave_applications')
        .select('*, employees(full_name), leave_types(name, annual_days)')
        .order('applied_at', { ascending: false }),
    ])
    setEmps(e || [])
    setTypes(t || [])
    setRows(la || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const days = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1)
  const apply = async () => {
    if (!f.employee_id || !f.leave_type_id) {
      flash('Pick employee and leave type.')
      return
    }
    const { error } = await supabase
      .from('leave_applications')
      .insert({ ...f, days: days(f.from_date, f.to_date) })
    if (error) flash(error.message)
    else {
      setF({
        employee_id: '',
        leave_type_id: '',
        from_date: todayISO(),
        to_date: todayISO(),
        reason: '',
      })
      load()
    }
  }
  const setStatus = async (id, status) => {
    await supabase
      .from('leave_applications')
      .update({ status, approved_by: userName, approved_at: new Date().toISOString() })
      .eq('id', id)
    load()
  }
  const taken = (empId, typeId) =>
    rows
      .filter(
        (r) => r.employee_id === empId && r.leave_type_id === typeId && r.status === 'APPROVED',
      )
      .reduce((a, r) => a + +r.days, 0)

  const columns = useMemo(
    () => [
      {
        key: 'employee',
        label: 'Employee',
        render: (row) => <span className="text-sm">{row.employees?.full_name || '—'}</span>,
      },
      {
        key: 'type',
        label: 'Type',
        render: (row) => <span className="text-xs">{row.leave_types?.name || '—'}</span>,
      },
      {
        key: 'range',
        label: 'From -> To',
        render: (row) => (
          <span className="font-data text-xs">
            {fmtDate(row.from_date)} {'->'} {fmtDate(row.to_date)}
          </span>
        ),
      },
      {
        key: 'days',
        label: 'Days',
        align: 'right',
        render: (row) => <span className="font-data">{row.days}</span>,
      },
      {
        key: 'balance',
        label: 'Balance',
        align: 'right',
        render: (row) => {
          const bal =
            (+row.leave_types?.annual_days || 0) - taken(row.employee_id, row.leave_type_id)
          return <span className="font-data">{bal}</span>
        },
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <ModuleStatusPill status={row.status} toneMap={LEAVE_STATUS_TONES} />,
      },
      {
        key: 'actions',
        label: '',
        render: (row) =>
          row.status === 'PENDING' && canApprove ? (
            <div className="flex gap-1">
              <button
                className="text-forest"
                onClick={() => setStatus(row.id, 'APPROVED')}
                aria-label="Approve leave"
              >
                <Check size={15} />
              </button>
              <button
                className="text-red-500"
                onClick={() => setStatus(row.id, 'REJECTED')}
                aria-label="Reject leave"
              >
                <X size={15} />
              </button>
            </div>
          ) : null,
      },
    ],
    [canApprove, rows],
  )

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <select
          className="input col-span-2"
          value={f.employee_id}
          onChange={(e) => setF({ ...f, employee_id: e.target.value })}
        >
          <option value="">Employee…</option>
          {emps.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={f.leave_type_id}
          onChange={(e) => setF({ ...f, leave_type_id: e.target.value })}
        >
          <option value="">Type…</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input"
          value={f.from_date}
          onChange={(e) => setF({ ...f, from_date: e.target.value })}
        />
        <input
          type="date"
          className="input"
          value={f.to_date}
          onChange={(e) => setF({ ...f, to_date: e.target.value })}
        />
        <button className="btn-primary justify-center" onClick={apply}>
          <Plus size={15} /> Apply
        </button>
      </div>
      <ModuleDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No leave applications."
      />
    </div>
  )
}

function CompLeave({ flash }) {
  const [emps, setEmps] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState({ employee_id: '', earned_date: todayISO(), days: 1, reason: '' })

  const load = async () => {
    setLoading(true)
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from('employees').select('id, full_name').eq('status', 'ACTIVE').order('full_name'),
      supabase
        .from('comp_leave_register')
        .select('*, employees(full_name)')
        .order('earned_date', { ascending: false }),
    ])
    setEmps(e || [])
    setRows(c || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!f.employee_id) return
    const { error } = await supabase.from('comp_leave_register').insert({ ...f, days: +f.days })
    if (error) flash(error.message)
    else {
      setF({ employee_id: '', earned_date: todayISO(), days: 1, reason: '' })
      load()
    }
  }
  const toggle = async (r) => {
    await supabase
      .from('comp_leave_register')
      .update({ used: !r.used, used_date: !r.used ? todayISO() : null })
      .eq('id', r.id)
    load()
  }

  const columns = useMemo(
    () => [
      {
        key: 'employee',
        label: 'Employee',
        render: (row) => <span className="text-sm">{row.employees?.full_name || '—'}</span>,
      },
      {
        key: 'earned_date',
        label: 'Earned',
        render: (row) => <span className="font-data text-xs">{fmtDate(row.earned_date)}</span>,
      },
      {
        key: 'days',
        label: 'Days',
        align: 'right',
        render: (row) => <span className="font-data">{row.days}</span>,
      },
      {
        key: 'reason',
        label: 'Reason',
        render: (row) => <span className="text-xs">{row.reason || '—'}</span>,
      },
      {
        key: 'used',
        label: 'Used',
        render: (row) => (
          <button
            onClick={() => toggle(row)}
            className="text-left"
            aria-label="Toggle comp leave used status"
          >
            <ModuleStatusPill
              status={
                row.used
                  ? `USED ${row.used_date ? fmtDate(row.used_date) : ''}`.trim()
                  : 'AVAILABLE'
              }
              toneMap={COMP_LEAVE_TONES}
            />
          </button>
        ),
      },
    ],
    [rows],
  )

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-5 gap-2">
        <select
          className="input col-span-2"
          value={f.employee_id}
          onChange={(e) => setF({ ...f, employee_id: e.target.value })}
        >
          <option value="">Employee…</option>
          {emps.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input"
          value={f.earned_date}
          onChange={(e) => setF({ ...f, earned_date: e.target.value })}
        />
        <input
          className="input"
          placeholder="Reason (worked on holiday)"
          value={f.reason}
          onChange={(e) => setF({ ...f, reason: e.target.value })}
        />
        <button className="btn-primary justify-center" onClick={add}>
          <Plus size={15} /> Earn
        </button>
      </div>
      <ModuleDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No compensatory leave recorded."
      />
    </div>
  )
}

const SUB_VIEWS = [
  { key: '', label: 'Leave Applications' },
  { key: 'comp-leave', label: 'Compensatory Leave' },
]

export default function LeaveTab({ flash, userName, canApprove, view, setView }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-leaf/60">
        {SUB_VIEWS.map((sv) => (
          <button
            key={sv.key}
            onClick={() => setView(sv.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t ${view === sv.key ? 'bg-white border border-leaf border-b-white text-forest -mb-px' : 'text-pine/60 hover:text-pine'}`}
          >
            {sv.label}
          </button>
        ))}
      </div>
      {view !== 'comp-leave' ? (
        <LeaveApplications flash={flash} userName={userName} canApprove={canApprove} />
      ) : (
        <CompLeave flash={flash} />
      )}
    </div>
  )
}
