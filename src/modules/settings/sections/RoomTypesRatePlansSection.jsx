import { useEffect, useState } from 'react'
import { Plus, Trash2, BedDouble } from 'lucide-react'
import { supabase } from 'src/lib/supabase'
import { getTenantId } from 'src/lib/tenant'
import { Button } from 'src/components/ui/button'

/**
 * AEDS PMS-P01 remediation — completes the room_types/rate_plans
 * vertical slice (schema was created earlier; this is the missing
 * frontend). Standalone settings section, does not touch rooms.room_type
 * or any existing check-in/checkout/billing flow — purely additive
 * management UI for the new tables.
 */
export default function RoomTypesRatePlansSection() {
  const tenantId = getTenantId()
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTypeName, setNewTypeName] = useState('')
  const [newRatePlan, setNewRatePlan] = useState({}) // { [roomTypeId]: { name, base_rate } }

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('room_types')
      .select('*, rate_plans(*)')
      .order('name')
    if (err) setError(err.message)
    else setRoomTypes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const addRoomType = async () => {
    if (!newTypeName.trim()) return
    const code = newTypeName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
    const { error: err } = await supabase.from('room_types').insert({
      tenant_id: tenantId,
      code,
      name: newTypeName.trim(),
      created_by: 'SETTINGS_UI',
    })
    if (err) {
      setError(err.message)
      return
    }
    setNewTypeName('')
    load()
  }

  const removeRoomType = async (id) => {
    const { error: err } = await supabase.from('room_types').delete().eq('id', id)
    if (err) setError(err.message)
    else load()
  }

  const addRatePlan = async (roomTypeId) => {
    const draft = newRatePlan[roomTypeId]
    if (!draft?.name || !draft?.base_rate) return
    const code = draft.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
    const { error: err } = await supabase.from('rate_plans').insert({
      tenant_id: tenantId,
      room_type_id: roomTypeId,
      code,
      name: draft.name.trim(),
      base_rate: Number(draft.base_rate),
      created_by: 'SETTINGS_UI',
    })
    if (err) {
      setError(err.message)
      return
    }
    setNewRatePlan((prev) => ({ ...prev, [roomTypeId]: {} }))
    load()
  }

  const removeRatePlan = async (id) => {
    const { error: err } = await supabase.from('rate_plans').delete().eq('id', id)
    if (err) setError(err.message)
    else load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-forest/10 text-forest">
          <BedDouble size={21} />
        </div>
        <div>
          <h2 className="font-display font-semibold text-pine text-lg">
            Room Types &amp; Rate Plans
          </h2>
          <p className="text-sm text-pine/60">Manage room categories and their standard rates.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card p-4 flex gap-2">
        <input
          className="input flex-1"
          placeholder="New room type name (e.g. Deluxe Suite)"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
        />
        <Button variant="default" onClick={addRoomType}>
          <Plus size={15} /> Add Room Type
        </Button>
      </div>

      {loading && <p className="text-sm text-pine/50">Loading…</p>}

      {!loading && roomTypes.length === 0 && (
        <p className="text-sm text-pine/50">No room types configured yet.</p>
      )}

      <div className="space-y-3">
        {roomTypes.map((rt) => (
          <div key={rt.id} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-leaf px-4 py-3">
              <div>
                <span className="font-semibold text-pine">{rt.name}</span>
                <span className="ml-2 text-xs text-pine/40 font-mono">{rt.code}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400"
                onClick={() => removeRoomType(rt.id)}
                aria-label={`Delete ${rt.name}`}
              >
                <Trash2 size={14} />
              </Button>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Rate Plan</th>
                  <th className="th text-right">Base Rate</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {(rt.rate_plans || []).map((rp) => (
                  <tr key={rp.id}>
                    <td className="td text-sm">{rp.name}</td>
                    <td className="td text-right text-sm money">
                      ৳{Number(rp.base_rate).toLocaleString('en-BD')}
                    </td>
                    <td className="td">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400"
                        onClick={() => removeRatePlan(rp.id)}
                        aria-label={`Delete ${rp.name}`}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="td">
                    <input
                      className="input h-8 text-sm"
                      placeholder="New rate plan name"
                      value={newRatePlan[rt.id]?.name || ''}
                      onChange={(e) =>
                        setNewRatePlan((prev) => ({
                          ...prev,
                          [rt.id]: { ...prev[rt.id], name: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td className="td text-right">
                    <input
                      type="number"
                      className="input h-8 text-sm text-right"
                      placeholder="0.00"
                      value={newRatePlan[rt.id]?.base_rate || ''}
                      onChange={(e) =>
                        setNewRatePlan((prev) => ({
                          ...prev,
                          [rt.id]: { ...prev[rt.id], base_rate: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td className="td">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => addRatePlan(rt.id)}
                      aria-label={`Add rate plan for ${rt.name}`}
                    >
                      <Plus size={14} />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
