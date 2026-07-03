import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from 'src/app/paths'
import { fmtBDT } from 'src/lib/helpers'
import { getTenantId } from 'src/lib/tenant'
import { supabase } from 'src/supabase'

export const RESTAURANT_TABLES = Array.from({ length: 25 }, (_, index) => `T${String(index + 1).padStart(2, '0')}`)
export const TABLE_BLOCKING_STATUSES = ['DRAFT', 'OPEN', 'ACCEPTED', 'READY', 'SERVED']

export function normalizeRestaurantTable(value) {
  const raw = String(value || '').trim().toUpperCase()
  if (!raw) return ''
  const digits = raw.replaceAll(/[^0-9]/g, '')
  if (!digits) return raw
  return `T${digits.padStart(2, '0')}`
}

function withTenant(query) {
  const tenantId = getTenantId()
  return tenantId ? query.eq('tenant_id', tenantId) : query
}

export default function RestaurantTableGrid({ refreshKey = 0, onSelectTable, title = 'Restaurant tables', subtitle = 'Click a blocked table to continue its draft bill.', className = '' }) {
  const navigate = useNavigate()
  const [blockedRows, setBlockedRows] = useState([])

  useEffect(() => {
    let active = true

    async function loadBlockedTables() {
      const { data } = await withTenant(
        supabase
          .from('pos_orders')
          .select('id, order_no, table_no, status, total, guest_name, created_at')
          .not('table_no', 'is', null)
          .in('status', TABLE_BLOCKING_STATUSES)
          .order('created_at', { ascending: false })
          .limit(200)
      )
      if (!active) return
      setBlockedRows(data || [])
    }

    loadBlockedTables()
    return () => { active = false }
  }, [refreshKey])

  const tableMap = useMemo(() => {
    const next = new Map()
    for (const row of blockedRows) {
      const key = normalizeRestaurantTable(row.table_no)
      if (key && !next.has(key)) next.set(key, row)
    }
    return next
  }, [blockedRows])

  const handleSelect = (tableNo) => {
    const normalized = normalizeRestaurantTable(tableNo)
    const row = tableMap.get(normalized) || null
    if (onSelectTable) {
      onSelectTable(normalized, row)
      return
    }
    navigate(`${PATHS.RESTAURANT}?tab=pos&table=${encodeURIComponent(normalized)}`)
  }

  return (
    <div className={`card p-5 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-pine">{title}</h3>
          <p className="text-sm text-pine/60 mt-1">{subtitle}</p>
        </div>
        <div className="rounded-full bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">
          Blocked {tableMap.size}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {RESTAURANT_TABLES.map((tableNo) => {
          const row = tableMap.get(tableNo)
          const blocked = Boolean(row)
          return (
            <button
              key={tableNo}
              type="button"
              onClick={() => handleSelect(tableNo)}
              className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                blocked
                  ? 'border-amber/40 bg-amber/10 hover:border-amber'
                  : 'border-leaf bg-white hover:border-forest/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-semibold text-pine">{tableNo}</span>
                <span className={`status-chip text-[10px] ${blocked ? 'bg-amber/20 text-amber' : 'bg-forest/15 text-forest'}`}>
                  {blocked ? row.status : 'FREE'}
                </span>
              </div>
              <div className="mt-2 min-h-10 text-xs text-pine/70">
                {blocked ? (
                  <>
                    <div className="font-medium text-pine">{row.order_no || 'Draft bill'}</div>
                    <div>{row.guest_name || 'Walk-in guest'}</div>
                    <div className="mt-1 font-semibold text-amber">{fmtBDT(row.total || 0)}</div>
                  </>
                ) : (
                  <div>Tap to start or continue service.</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
