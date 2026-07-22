import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import KPICards from '../components/KPICards.jsx'
import { BellRing } from 'lucide-react'
import { getTenantId, withTenantInsert, withTenantInsertMany } from '../lib/tenant'

const STATUSES = ['Clean', 'Dirty', 'Inspected', 'Out of Order']
const CHECKOUT_CLEAR_STATUS = 'Inspected'
const NO_TENANT_SENTINEL = '00000000-0000-0000-0000-000000000000'
const CHIP = {
  Clean: 'bg-forest/15 text-forest',
  Inspected: 'bg-sky-100 text-sky-700',
  Dirty: 'bg-amber/20 text-amber',
  'Out of Order': 'bg-red-100 text-red-600',
}

const withTenant = (query) => {
  const tenantId = getTenantId()
  return query.eq('tenant_id', tenantId || NO_TENANT_SENTINEL)
}

export default function HousekeepingHub({ role, isAdmin, userName }) {
  const [rooms, setRooms] = useState([])
  const [requests, setRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [templates, setTemplates] = useState([])
  const [templateItems, setTemplateItems] = useState([])
  const [assignmentChecks, setAssignmentChecks] = useState([])
  const [assigneeByRoom, setAssigneeByRoom] = useState({})
  const [msg, setMsg] = useState('')

  const canEdit = isAdmin || ['SUPERUSER', 'MANAGER', 'HOUSEKEEPING'].includes(role)

  const activeAssignmentsByRoom = useMemo(() => {
    const map = new Map()
    for (const row of assignments) {
      if (!map.has(row.room_id)) map.set(row.room_id, row)
    }
    return map
  }, [assignments])

  const checksByAssignment = useMemo(() => {
    const map = new Map()
    for (const row of assignmentChecks) {
      if (!map.has(row.assignment_id)) map.set(row.assignment_id, [])
      map.get(row.assignment_id).push(row)
    }
    return map
  }, [assignmentChecks])

  const loadAll = async () => {
    const [
      { data: roomRows },
      { data: requestRows },
      { data: employeeRows },
      { data: assignmentRows },
      { data: templateRows },
    ] = await Promise.all([
      withTenant(supabase.from('rooms').select('*').eq('is_active', true)).order('room_no'),
      withTenant(
        supabase
          .from('tasks')
          .select('id, title, description, status, created_at, due_date')
          .eq('source', 'CHECKOUT_CLEARANCE')
          .in('status', ['OPEN', 'IN_PROGRESS'])
          .order('created_at', { ascending: false })
          .limit(40),
      ),
      withTenant(supabase.from('employees').select('id, full_name').eq('status', 'ACTIVE')).order(
        'full_name',
      ),
      withTenant(
        supabase
          .from('housekeeping_assignments')
          .select('*')
          .in('status', ['ASSIGNED', 'IN_PROGRESS', 'INSPECTED'])
          .order('created_at', { ascending: false }),
      ),
      withTenant(
        supabase.from('housekeeping_inspection_templates').select('*').eq('is_active', true),
      ).order('is_default', { ascending: false }),
    ])

    setRooms(roomRows || [])
    setRequests(requestRows || [])
    setEmployees(employeeRows || [])
    setAssignments(assignmentRows || [])
    setTemplates(templateRows || [])

    const templateIds = (templateRows || []).map((row) => row.id)
    if (templateIds.length) {
      const { data: itemRows } = await withTenant(
        supabase
          .from('housekeeping_inspection_items')
          .select('*')
          .in('template_id', templateIds)
          .eq('is_active', true),
      ).order('sort_order', { ascending: true })
      setTemplateItems(itemRows || [])
    } else {
      setTemplateItems([])
    }

    const assignmentIds = (assignmentRows || []).map((row) => row.id)
    if (assignmentIds.length) {
      const { data: checkRows } = await withTenant(
        supabase
          .from('housekeeping_assignment_checks')
          .select('*')
          .in('assignment_id', assignmentIds),
      ).order('checked_at', { ascending: false })
      setAssignmentChecks(checkRows || [])
    } else {
      setAssignmentChecks([])
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const clearRoomRequests = async (room) => {
    const roomTag = `Room ${room.room_no}`
    const pendingIds = requests.filter((r) => (r.title || '').includes(roomTag)).map((r) => r.id)
    if (!pendingIds.length) return
    await supabase
      .from('tasks')
      .update({
        status: 'DONE',
        completed_by: userName || role || 'HOUSEKEEPING',
        completed_at: new Date().toISOString(),
      })
      .in('id', pendingIds)
  }

  const updateStatus = async (room, newStatus) => {
    if (!canEdit) {
      setMsg('Front Office role cannot change housekeeping status — ask a Manager or Admin.')
      setTimeout(() => setMsg(''), 4000)
      return
    }
    const { error } = await withTenant(
      supabase.from('rooms').update({ hk_status: newStatus }).eq('id', room.id),
    )
    if (error) {
      setMsg(error.message)
      setTimeout(() => setMsg(''), 4000)
      return
    }
    if (newStatus === CHECKOUT_CLEAR_STATUS) await clearRoomRequests(room)
    loadAll()
  }

  const assignRoom = async (room) => {
    if (!canEdit) return
    const assignedTo = assigneeByRoom[room.id] || null
    const defaultTemplate = templates.find((row) => row.is_default) || templates[0]
    if (!defaultTemplate) {
      setMsg('No active inspection template found.')
      setTimeout(() => setMsg(''), 4000)
      return
    }

    const { data: assignment, error } = await supabase
      .from('housekeeping_assignments')
      .insert(
        withTenantInsert({
          room_id: room.id,
          template_id: defaultTemplate.id,
          assigned_to: assignedTo,
          assigned_by: userName || role || 'HOUSEKEEPING',
          due_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'ASSIGNED',
        }),
      )
      .select('*')
      .single()
    if (error) {
      setMsg(error.message)
      setTimeout(() => setMsg(''), 4000)
      return
    }

    const defaults = templateItems
      .filter((row) => row.template_id === defaultTemplate.id)
      .map((row) => ({
        assignment_id: assignment.id,
        inspection_item_id: row.id,
        item_label: row.item_label,
        is_passed: false,
      }))
    if (defaults.length) {
      await supabase.from('housekeeping_assignment_checks').insert(withTenantInsertMany(defaults))
    }

    loadAll()
  }

  const updateAssignmentCheck = async (
    assignment,
    itemLabel,
    nextValue,
    inspectionItemId = null,
  ) => {
    const payload = withTenantInsert({
      assignment_id: assignment.id,
      inspection_item_id: inspectionItemId,
      item_label: itemLabel,
      is_passed: nextValue,
      checked_by: userName || role || 'HOUSEKEEPING',
      checked_at: new Date().toISOString(),
    })
    const { error } = await supabase
      .from('housekeeping_assignment_checks')
      .upsert(payload, { onConflict: 'tenant_id,assignment_id,item_label' })
    if (error) {
      setMsg(error.message)
      setTimeout(() => setMsg(''), 4000)
      return
    }
    loadAll()
  }

  const completeAssignment = async (assignment) => {
    const { error } = await supabase.rpc('complete_housekeeping_assignment', {
      p_assignment_id: assignment.id,
      p_completion_note: `Completed by ${userName || role || 'HOUSEKEEPING'}`,
    })
    if (error) {
      setMsg(error.message)
      setTimeout(() => setMsg(''), 4000)
      return
    }
    loadAll()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-pine mb-1">Housekeeping Hub</h1>
      <p className="text-sm text-pine/60 mb-5">
        Track and update the cleaning status of every room. Mark a room as Inspected to grant
        check-out clearance.
      </p>
      <KPICards module="housekeeping" />
      {msg && <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{msg}</div>}
      {!canEdit && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-amber/10 text-amber text-sm">
          Read-only — your role can view housekeeping status but not change it.
        </div>
      )}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-2 text-pine">
          <BellRing size={16} className="text-sky-600" />
          <h3 className="font-display font-semibold">Checkout Clearance Requests</h3>
          <span className="status-chip bg-sky-100 text-sky-700">{requests.length}</span>
        </div>
        {requests.length === 0 && (
          <p className="text-sm text-pine/50">No pending clearance requests.</p>
        )}
        {requests.length > 0 && (
          <div className="space-y-2">
            {requests.slice(0, 8).map((r) => (
              <div key={r.id} className="rounded-lg border border-leaf p-3 bg-white">
                <div className="text-sm font-semibold text-pine">{r.title}</div>
                {r.description && (
                  <div className="text-xs text-pine/60 whitespace-pre-wrap mt-0.5">
                    {r.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-pine">
                Room {room.room_no}
                {room.room_name ? ` · ${room.room_name}` : ''}
              </h3>
              <span
                className={`status-chip ${CHIP[room.hk_status] || 'bg-stone-200 text-stone-600'}`}
              >
                {room.hk_status || 'Clean'}
              </span>
            </div>
            <p className="text-xs text-pine/50 mt-1">{room.room_type}</p>
            <div className="mt-2">
              {activeAssignmentsByRoom.get(room.id) ? (
                <span className="status-chip bg-sky-100 text-sky-700">Assignment active</span>
              ) : (
                <span className="status-chip bg-stone-100 text-stone-700">No assignment</span>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <label className="label">Change status</label>
              <select
                value={room.hk_status || 'Clean'}
                onChange={(e) => updateStatus(room, e.target.value)}
                className="input"
                disabled={!canEdit}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                className="btn-ghost w-full justify-center"
                onClick={() => updateStatus(room, CHECKOUT_CLEAR_STATUS)}
                disabled={!canEdit}
              >
                Mark checkout clearance
              </button>

              {!activeAssignmentsByRoom.get(room.id) && (
                <>
                  <label className="label">Assign to attendant</label>
                  <select
                    className="input"
                    value={assigneeByRoom[room.id] || ''}
                    onChange={(event) =>
                      setAssigneeByRoom((prev) => ({ ...prev, [room.id]: event.target.value }))
                    }
                    disabled={!canEdit}
                  >
                    <option value="">Unassigned</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn-primary w-full justify-center"
                    onClick={() => assignRoom(room)}
                    disabled={!canEdit}
                  >
                    Create assignment
                  </button>
                </>
              )}

              {activeAssignmentsByRoom.get(room.id) &&
                (() => {
                  const assignment = activeAssignmentsByRoom.get(room.id)
                  const checks = checksByAssignment.get(assignment.id) || []
                  const checklist = checks.length
                    ? checks
                    : templateItems
                        .filter((row) => row.template_id === assignment.template_id)
                        .map((row) => ({
                          item_label: row.item_label,
                          is_passed: false,
                          inspection_item_id: row.id,
                        }))
                  const passedCount = checklist.filter((row) => row.is_passed).length

                  return (
                    <div className="rounded-lg border border-leaf p-3 bg-white space-y-2">
                      <div className="text-xs text-pine/70">
                        Checklist {passedCount}/{checklist.length || 0}
                      </div>
                      <div className="space-y-1 max-h-36 overflow-auto pr-1">
                        {checklist.map((row) => (
                          <label
                            key={`${assignment.id}-${row.item_label}`}
                            className="flex items-center gap-2 text-xs text-pine"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(row.is_passed)}
                              onChange={(event) =>
                                updateAssignmentCheck(
                                  assignment,
                                  row.item_label,
                                  event.target.checked,
                                  row.inspection_item_id,
                                )
                              }
                              disabled={!canEdit}
                            />
                            <span>{row.item_label}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        className="btn-primary w-full justify-center"
                        onClick={() => completeAssignment(assignment)}
                        disabled={!canEdit}
                      >
                        Complete assignment
                      </button>
                    </div>
                  )
                })()}
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="text-sm text-pine/40">No active rooms — add rooms in Settings.</p>
        )}
      </div>
    </div>
  )
}
