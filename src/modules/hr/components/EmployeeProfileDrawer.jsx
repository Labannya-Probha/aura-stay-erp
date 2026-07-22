import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { fmtDate, todayISO } from '../../../lib/helpers'
import { Plus, Trash2 } from 'lucide-react'
import ModuleDialogShell from 'src/components/shared/ModuleDialogShell'
import { useLayerFocus } from 'src/hooks/accessibility/useLayerFocus'
import { useGridKeyboardNavigation } from 'src/hooks/accessibility/useGridKeyboardNavigation'

function ProfileTab({ emp, onSave, flash }) {
  const [f, setF] = useState(emp)
  const save = async () => {
    const { error } = await supabase
      .from('employees')
      .update({
        full_name: f.full_name,
        designation: f.designation,
        department: f.department,
        phone: f.phone,
        gross_salary: f.gross_salary ? +f.gross_salary : null,
        join_date: f.join_date,
        status: f.status,
      })
      .eq('id', emp.id)
    if (error) flash(error.message)
    else {
      flash('Saved.')
      onSave?.()
    }
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={f.full_name || ''}
            onChange={(e) => setF({ ...f, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Designation</label>
          <input
            className="input"
            value={f.designation || ''}
            onChange={(e) => setF({ ...f, designation: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Department</label>
          <input
            className="input"
            value={f.department || ''}
            onChange={(e) => setF({ ...f, department: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={f.phone || ''}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Join Date</label>
          <input
            type="date"
            className="input"
            value={f.join_date || ''}
            onChange={(e) => setF({ ...f, join_date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Gross Salary (৳)</label>
          <input
            type="number"
            className="input money"
            value={f.gross_salary || ''}
            onChange={(e) => setF({ ...f, gross_salary: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={f.status || 'ACTIVE'}
            onChange={(e) => setF({ ...f, status: e.target.value })}
          >
            {['ACTIVE', 'INACTIVE', 'TERMINATED'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="button" className="btn-primary" onClick={save}>
        Save Changes
      </button>
    </div>
  )
}

function ServiceBookTab({ empId, flash, userName }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({
    event_date: todayISO(),
    event_type: 'OTHER',
    description: '',
    order_no: '',
  })

  const load = async () => {
    const { data } = await supabase
      .from('service_book')
      .select('*')
      .eq('employee_id', empId)
      .order('event_date', { ascending: false })
    setRows(data || [])
  }
  useEffect(() => {
    load()
  }, [empId])

  const add = async () => {
    if (!f.description) {
      flash('Description required.')
      return
    }
    const { error } = await supabase
      .from('service_book')
      .insert({ ...f, employee_id: empId, created_by: userName })
    if (error) flash(error.message)
    else {
      setF({ event_date: todayISO(), event_type: 'OTHER', description: '', order_no: '' })
      load()
    }
  }
  const remove = async (id) => {
    const { error } = await supabase.from('service_book').delete().eq('id', id)
    if (error) {
      flash(error.message)
      return
    }
    load()
  }

  const { tableRef, onKeyDown } = useGridKeyboardNavigation({
    columns: 4,
    rows: Math.max(rows.length, 1),
    enabled: true,
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 items-end">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={f.event_date}
            onChange={(e) => setF({ ...f, event_date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={f.event_type}
            onChange={(e) => setF({ ...f, event_type: e.target.value })}
          >
            {[
              'JOINING',
              'PROMOTION',
              'TRANSFER',
              'TRAINING',
              'AWARD',
              'DISCIPLINARY',
              'RESIGNATION',
              'TERMINATION',
              'OTHER',
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </div>
        <button type="button" className="btn-primary justify-center" onClick={add}>
          <Plus size={14} /> Add
        </button>
      </div>
      <table
        ref={tableRef}
        className="w-full text-sm"
        role="grid"
        aria-label="Service book entries"
        aria-rowcount={Math.max(rows.length, 1)}
        aria-colcount={4}
        onKeyDown={onKeyDown}
      >
        <thead>
          <tr role="row">
            <th className="th" role="columnheader">
              Date
            </th>
            <th className="th" role="columnheader">
              Type
            </th>
            <th className="th" role="columnheader">
              Description
            </th>
            <th className="th" role="columnheader">
              Actions
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((r, rowIndex) => (
            <tr key={r.id} role="row" aria-rowindex={rowIndex + 1}>
              <td
                className="td money text-xs"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={0}
              >
                {fmtDate(r.event_date)}
              </td>
              <td
                className="td text-xs"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={1}
              >
                {r.event_type}
              </td>
              <td
                className="td text-sm"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={2}
              >
                {r.description}
              </td>
              <td
                className="td text-right"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={3}
              >
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="text-red-400 hover:text-red-600"
                  aria-label={`Delete service entry ${rowIndex + 1}`}
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr role="row">
              <td className="td text-pine/40" colSpan={4} role="gridcell">
                No entries.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function NomineesTab({ empId, flash }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ full_name: '', relation: '', share_pct: 100, nid_no: '', phone: '' })

  const load = async () => {
    const { data } = await supabase.from('employee_nominees').select('*').eq('employee_id', empId)
    setRows(data || [])
  }
  useEffect(() => {
    load()
  }, [empId])

  const add = async () => {
    if (!f.full_name || !f.relation) {
      flash('Name and relation required.')
      return
    }
    const { error } = await supabase
      .from('employee_nominees')
      .insert({ ...f, employee_id: empId, share_pct: +f.share_pct })
    if (error) flash(error.message)
    else {
      setF({ full_name: '', relation: '', share_pct: 100, nid_no: '', phone: '' })
      load()
    }
  }
  const remove = async (id) => {
    const { error } = await supabase.from('employee_nominees').delete().eq('id', id)
    if (error) {
      flash(error.message)
      return
    }
    load()
  }

  const { tableRef, onKeyDown } = useGridKeyboardNavigation({
    columns: 6,
    rows: Math.max(rows.length, 1),
    enabled: true,
  })

  const totalShare = rows.reduce((s, r) => s + (+r.share_pct || 0), 0)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={f.full_name}
            onChange={(e) => setF({ ...f, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Relation</label>
          <input
            className="input"
            value={f.relation}
            onChange={(e) => setF({ ...f, relation: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Share %</label>
          <input
            type="number"
            className="input"
            value={f.share_pct}
            onChange={(e) => setF({ ...f, share_pct: e.target.value })}
          />
        </div>
        <div>
          <label className="label">NID No.</label>
          <input
            className="input"
            value={f.nid_no}
            onChange={(e) => setF({ ...f, nid_no: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </div>
        <button type="button" className="btn-primary justify-center" onClick={add}>
          <Plus size={14} /> Add
        </button>
      </div>
      {totalShare !== 100 && rows.length > 0 && (
        <div className="text-xs text-amber font-semibold">
          Warning: total share is {totalShare}% (should be 100%)
        </div>
      )}
      <table
        ref={tableRef}
        className="w-full text-sm"
        role="grid"
        aria-label="Nominee entries"
        aria-rowcount={Math.max(rows.length, 1)}
        aria-colcount={6}
        onKeyDown={onKeyDown}
      >
        <thead>
          <tr role="row">
            <th className="th" role="columnheader">
              Name
            </th>
            <th className="th" role="columnheader">
              Relation
            </th>
            <th className="th text-right" role="columnheader">
              Share %
            </th>
            <th className="th" role="columnheader">
              NID
            </th>
            <th className="th" role="columnheader">
              Phone
            </th>
            <th className="th" role="columnheader">
              Actions
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((r, rowIndex) => (
            <tr key={r.id} role="row" aria-rowindex={rowIndex + 1}>
              <td
                className="td font-medium"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={0}
              >
                {r.full_name}
              </td>
              <td
                className="td text-xs"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={1}
              >
                {r.relation}
              </td>
              <td
                className="td text-right"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={2}
              >
                {r.share_pct}%
              </td>
              <td
                className="td text-xs"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={3}
              >
                {r.nid_no || '—'}
              </td>
              <td
                className="td text-xs"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={4}
              >
                {r.phone || '—'}
              </td>
              <td
                className="td text-right"
                role="gridcell"
                tabIndex={0}
                data-grid-cell="true"
                data-row-index={rowIndex}
                data-col-index={5}
              >
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="text-red-400 hover:text-red-600"
                  aria-label={`Delete nominee ${rowIndex + 1}`}
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr role="row">
              <td className="td text-pine/40" colSpan={6} role="gridcell">
                No nominees.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const TABS = ['Profile', 'Service Book', 'Nominees']

export default function EmployeeProfileDrawer({ emp, onClose, flash, onSave, userName }) {
  const [activeTab, setActiveTab] = useState('Profile')
  const containerRef = useRef(null)

  useLayerFocus({
    open: Boolean(emp),
    containerRef,
    initialFocusSelector:
      '[data-autofocus], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    restoreFocus: true,
  })

  useEffect(() => {
    if (!emp) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [emp, onClose])

  if (!emp) return null
  return (
    <ModuleDialogShell
      open={Boolean(emp)}
      onClose={onClose}
      title={emp.full_name}
      subtitle={`${emp.designation || 'Designation not set'}${emp.department ? ` · ${emp.department}` : ''}`}
    >
      <div
        ref={containerRef}
        role="region"
        aria-label="Employee profile"
        className="flex max-h-[70vh] flex-col"
      >
        <div
          className="flex gap-1 px-6 pt-3 border-b border-leaf/60"
          role="tablist"
          aria-label="Employee profile tabs"
        >
          {TABS.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setActiveTab(t)}
              role="tab"
              aria-selected={activeTab === t}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t ${activeTab === t ? 'bg-white border border-leaf border-b-white text-forest -mb-px' : 'text-pine/60 hover:text-pine'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'Profile' && <ProfileTab emp={emp} onSave={onSave} flash={flash} />}
          {activeTab === 'Service Book' && (
            <ServiceBookTab empId={emp.id} flash={flash} userName={userName} />
          )}
          {activeTab === 'Nominees' && <NomineesTab empId={emp.id} flash={flash} />}
        </div>
      </div>
    </ModuleDialogShell>
  )
}
