import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { fmtBDT, todayISO } from '../../../lib/helpers'
import { Plus } from 'lucide-react'
import EmployeeProfileDrawer from '../components/EmployeeProfileDrawer'
import ModuleDataTable from 'src/components/shared/ModuleDataTable'
import ModuleStatusPill from 'src/components/shared/ModuleStatusPill'

const EMPLOYEE_STATUS_TONES = {
  ACTIVE: 'success',
  RESIGNED: 'neutral',
  TERMINATED: 'danger',
}

export default function EmployeesTab({ flash, isAdmin, userName }) {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState({
    full_name: '',
    designation: '',
    department: '',
    join_date: todayISO(),
    phone: '',
    gross_salary: '',
  })

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').order('created_at')
    setRows(data || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!f.full_name) return
    const { error } = await supabase
      .from('employees')
      .insert({ ...f, gross_salary: +f.gross_salary || 0 })
    if (error) flash(error.message)
    else {
      setF({
        full_name: '',
        designation: '',
        department: '',
        join_date: todayISO(),
        phone: '',
        gross_salary: '',
      })
      load()
    }
  }

  const setStatus = async (id, status) => {
    await supabase.from('employees').update({ status }).eq('id', id)
    load()
  }

  const columns = useMemo(
    () => [
      {
        key: 'emp_code',
        label: 'Code',
        render: (row) => <span className="font-data text-xs">{row.emp_code || '—'}</span>,
      },
      {
        key: 'full_name',
        label: 'Name',
        render: (row) => (
          <span className="text-sm font-medium text-forest underline-offset-2 hover:underline">
            {row.full_name || '—'}
          </span>
        ),
      },
      {
        key: 'designation',
        label: 'Designation',
        render: (row) => <span className="text-sm">{row.designation || '—'}</span>,
      },
      {
        key: 'department',
        label: 'Dept',
        render: (row) => <span className="text-xs">{row.department || '—'}</span>,
      },
      {
        key: 'gross_salary',
        label: 'Gross',
        align: 'right',
        render: (row) => (
          <span className="font-data text-right">{fmtBDT(row.gross_salary || 0)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => (
          <div onClick={(event) => event.stopPropagation()}>
            {isAdmin ? (
              <select
                className="input !w-32 !py-1"
                value={row.status}
                onChange={(event) => setStatus(row.id, event.target.value)}
              >
                {['ACTIVE', 'RESIGNED', 'TERMINATED'].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            ) : (
              <ModuleStatusPill status={row.status} toneMap={EMPLOYEE_STATUS_TONES} />
            )}
          </div>
        ),
      },
    ],
    [isAdmin],
  )

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <input
          className="input col-span-2"
          placeholder="Full name"
          value={f.full_name}
          onChange={(e) => setF({ ...f, full_name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Designation"
          value={f.designation}
          onChange={(e) => setF({ ...f, designation: e.target.value })}
        />
        <input
          className="input"
          placeholder="Department"
          value={f.department}
          onChange={(e) => setF({ ...f, department: e.target.value })}
        />
        <input
          type="number"
          className="input money"
          placeholder="Gross salary"
          value={f.gross_salary}
          onChange={(e) => setF({ ...f, gross_salary: e.target.value })}
        />
        <button className="btn-primary justify-center" onClick={add}>
          <Plus size={15} /> Add
        </button>
      </div>

      <ModuleDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No employees yet."
        onRowClick={setSelected}
      />

      {selected && (
        <EmployeeProfileDrawer
          emp={selected}
          userName={userName}
          flash={flash}
          onClose={() => setSelected(null)}
          onSave={() => {
            load()
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
