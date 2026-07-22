import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  fmtBDT,
  fmtDate,
  todayISO,
  nightsBetween,
  eachNight,
  rateFor,
  computeCharge,
  STATUS_COLORS,
} from '../lib/helpers'
import { loadReservationConfig } from '../lib/reservationConfig'
import {
  Search,
  Trash2,
  X,
  CheckCircle2,
  Building2,
  User,
  CalendarDays,
  Plus,
  BedDouble,
  Percent,
  SlidersHorizontal,
  MapPin,
  MessageSquare,
  ChevronDown,
} from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect.jsx'
import KPICards from '../components/KPICards.jsx'
import { Combobox } from '../components/ui/combobox'
import { LegacyButton } from '../components/ui/legacy-controls'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '../lib/utils'

const STATUSES = [
  'ALL',
  'QUERY',
  'QUOTED',
  'CONFIRMED',
  'NO_SHOW',
  'CHECKED_IN',
  'CHECKED_OUT',
  'SETTLED',
  'CANCELLED',
]
const STATUS_TO_TAB = {
  QUERY: 'Quotations',
  QUOTED: 'Quotations',
  CONFIRMED: 'Quotations',
  NO_SHOW: 'Overview',
  CHECKED_IN: 'Overview',
  CHECKED_OUT: 'Payments',
  SETTLED: 'Payments',
  CANCELLED: 'Overview',
}

export function StatusFilter({ q, setQ, filter, setFilter }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      <div className="relative w-full sm:flex-1 min-w-0">
        <Search size={15} className="absolute left-3 top-2.5 text-pine/40" />
        <input
          className="input pl-9 w-full"
          placeholder="Search name, phone, RES no, CUST ID..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="w-full sm:w-[220px] sm:shrink-0 relative z-30">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full bg-white border-leaf text-pine shadow-sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="z-[200] bg-white border-leaf shadow-xl">
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function dayName(dateStr) {
  if (!dateStr) return 'â€”'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
}

export default function Reservations({ openReservation, userName, prefill, clearPrefill }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [q, setQ] = useState('')
  const [showNew, setShowNew] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reservations')
      .select(
        'id,res_no,reservation_name,status,check_in,check_out,pax_adults,pax_children,source,created_at, guests:primary_guest_id(full_name,phone,customer_id), reservation_rooms(rooms(room_no,room_name))',
      )
      .order('created_at', { ascending: false })
      .limit(300)
    if (error) console.error('Reservations load error:', error.message)
    setRows(data || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])
  useEffect(() => {
    if (prefill) setShowNew(true)
  }, [prefill])

  const filtered = rows.filter(
    (r) =>
      (filter === 'ALL' || r.status === filter) &&
      (!q ||
        [r.res_no, r.reservation_name, r.guests?.full_name, r.guests?.phone, r.guests?.customer_id]
          .join(' ')
          .toLowerCase()
          .includes(q.toLowerCase())),
  )

  if (showNew) {
    return (
      <NewReservation
        prefill={prefill}
        close={() => {
          setShowNew(false)
          clearPrefill?.()
          load()
        }}
        openReservation={openReservation}
        userName={userName}
      />
    )
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-pine">Reservations</h1>
          </div>
          <div className="text-xs text-pine/50">
            Create new queries from <span className="font-semibold">Booking Calendar</span>.
          </div>
        </div>
        <KPICards module="reservations" />
        <StatusFilter q={q} setQ={setQ} filter={filter} setFilter={setFilter} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-pine/40 text-sm">Loading reservations...</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">Res No.</th>
                    <th className="th">Guest / Reservation name</th>
                    <th className="th">Stay</th>
                    <th className="th">Rooms</th>
                    <th className="th">Pax</th>
                    <th className="th">Source</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-leaf/30 cursor-pointer"
                      onClick={() => openReservation(r.id)}
                    >
                      <td className="td money font-medium">{r.res_no}</td>
                      <td className="td">
                        <div className="font-semibold">
                          {r.reservation_name || r.guests?.full_name || 'â€”'}
                        </div>
                        <div className="text-xs text-pine/50 flex items-center gap-1.5 flex-wrap">
                          {r.guests?.customer_id && (
                            <span className="font-mono bg-pine/10 text-pine/70 px-1 rounded text-[10px]">
                              {r.guests.customer_id}
                            </span>
                          )}
                          <span>{r.guests?.full_name}</span>
                          {r.guests?.phone && <span>Â· {r.guests.phone}</span>}
                        </div>
                      </td>
                      <td className="td money text-xs">
                        {fmtDate(r.check_in)} â†’ {fmtDate(r.check_out)}
                      </td>
                      <td className="td money text-xs font-semibold">
                        {(r.reservation_rooms || [])
                          .map((x) =>
                            x.rooms
                              ? `${x.rooms.room_no}${x.rooms.room_name ? ' (' + x.rooms.room_name + ')' : ''}`
                              : null,
                          )
                          .filter(Boolean)
                          .join(', ') || 'â€”'}
                      </td>
                      <td className="td money">{(r.pax_adults || 0) + (r.pax_children || 0)}</td>
                      <td className="td text-xs">{r.source || 'â€”'}</td>
                      <td className="td">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openReservation(r.id, STATUS_TO_TAB[r.status] || 'Overview')
                          }}
                          className={`status-chip ${STATUS_COLORS[r.status]} hover:ring-2 hover:ring-offset-1 hover:ring-pine/30 transition-shadow`}
                          title={`Open ${STATUS_TO_TAB[r.status] || 'Overview'} tab`}
                        >
                          {r.status.replace('_', ' ')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="td text-pine/50 text-center py-8" colSpan={7}>
                        No reservations found. Create a new query from Booking Calendar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-leaf">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  onClick={() => openReservation(r.id)}
                  className="p-4 active:bg-leaf/30 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {r.reservation_name || r.guests?.full_name || 'â€”'}
                      </div>
                      <div className="text-xs text-pine/50 truncate flex items-center gap-1">
                        {r.guests?.customer_id && (
                          <span className="font-mono bg-pine/10 text-pine/70 px-1 rounded text-[10px]">
                            {r.guests.customer_id}
                          </span>
                        )}
                        <span>
                          {r.guests?.full_name} {r.guests?.phone && `Â· ${r.guests.phone}`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openReservation(r.id, STATUS_TO_TAB[r.status] || 'Overview')
                      }}
                      className={`status-chip shrink-0 whitespace-nowrap ${STATUS_COLORS[r.status]}`}
                    >
                      {r.status.replace('_', ' ')}
                    </button>
                  </div>
                  <div className="text-xs text-pine/70 money mb-1">
                    {r.res_no} Â· {fmtDate(r.check_in)} â†’ {fmtDate(r.check_out)}
                  </div>
                  <div className="text-xs text-pine/60 money mb-1">
                    {(r.reservation_rooms || [])
                      .map((x) =>
                        x.rooms
                          ? `${x.rooms.room_no}${x.rooms.room_name ? ' (' + x.rooms.room_name + ')' : ''}`
                          : null,
                      )
                      .filter(Boolean)
                      .join(', ') || 'No rooms assigned'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-pine/50">
                    <span>{(r.pax_adults || 0) + (r.pax_children || 0)} pax</span>
                    <span>Â·</span>
                    <span>{r.source || 'â€”'}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-pine/50 text-center py-8 text-sm px-4">
                  No reservations found. Create a new query from Booking Calendar.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function GuestSearchPopup({ onSelect, onClose, onCreateContact }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!q.trim() || q.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('guests')
        .select('id, full_name, phone, email, address, customer_id, loyalty_points')
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,customer_id.ilike.%${q}%`)
        .order('full_name')
        .limit(10)
      setResults(data || [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  return (
    <div className="fixed inset-0 bg-ink/60 z-50 flex items-start justify-center overflow-auto overscroll-contain p-3 sm:p-4">
      <div className="card w-full max-w-md p-5 shadow-2xl my-0 sm:my-8 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-pine flex items-center gap-2">
            <UserSearch size={18} className="text-forest" /> Search Existing Guest
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-leaf text-pine/40"
          >
            <X size={15} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pine/30" />
          <input
            ref={inputRef}
            className="input pl-9 w-full"
            placeholder="Type name, phone, or CUST ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex-1 min-h-0">
          {loading && <p className="text-sm text-pine/40 text-center py-6">Searching...</p>}
          {!loading && q.length >= 2 && results.length === 0 && (
            <div className="py-4 space-y-3">
              <p className="text-sm text-pine/40 text-center">
                No guests found matching &quot;{q}&quot;
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <LegacyButton
                  type="button"
                  onClick={() => onCreateContact?.(q.trim(), false)}
                  className="flex-1 justify-center text-sm"
                >
                  Create contact: {q.trim()}
                </LegacyButton>
                <LegacyButton
                  type="button"
                  variant="ghost"
                  onClick={() => onCreateContact?.(q.trim(), true)}
                  className="flex-1 justify-center text-sm"
                >
                  Create & edit details
                </LegacyButton>
              </div>
            </div>
          )}
          {!loading && q.length < 2 && (
            <p className="text-sm text-pine/40 text-center py-6">
              Type at least 2 characters to search
            </p>
          )}
          <div className="space-y-1 h-full overflow-y-auto">
            {results.map((g) => (
              <button
                key={g.id}
                onClick={() => onSelect(g)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-leaf/40 border border-transparent hover:border-leaf transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-pine">{g.full_name}</div>
                    <div className="text-xs text-pine/50 flex items-center gap-2 flex-wrap mt-0.5">
                      {g.customer_id && (
                        <span className="font-mono bg-pine/10 text-pine/70 px-1.5 py-0.5 rounded text-[10px]">
                          {g.customer_id}
                        </span>
                      )}
                      {g.phone && <span>{g.phone}</span>}
                      {g.email && <span className="truncate">{g.email}</span>}
                    </div>
                  </div>
                  {g.loyalty_points > 0 && (
                    <span className="text-xs text-forest font-semibold shrink-0">
                      {g.loyalty_points} pts
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-leaf">
          <LegacyButton variant="ghost" onClick={onClose} className="w-full text-sm">
            Cancel â€” create new guest instead
          </LegacyButton>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  GUEST INLINE SEARCH  (Odoo-style â€” type name â†’ dropdown)          */
/* ================================================================== */
function GuestInlineSearch({
  value,
  disabled,
  onChange,
  onSelect,
  onCreateContact,
  inputRef,
  placeholder,
}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!value || value.length < 2 || disabled) {
      setResults([])
      setOpen(false)
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('guests')
        .select('id, full_name, phone, email, address, customer_id, loyalty_points')
        .or(`full_name.ilike.%${value}%,phone.ilike.%${value}%,customer_id.ilike.%${value}%`)
        .order('full_name')
        .limit(8)
      setResults(data || [])
      setLoading(false)
      setOpen(true)
    }, 280)
    return () => clearTimeout(t)
  }, [value, disabled])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showDropdown = open && !disabled && value?.length >= 2

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value)
          if (e.target.value.length >= 2) setOpen(true)
        }}
        onFocus={() => {
          if (value?.length >= 2) setOpen(true)
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-leaf bg-white shadow-xl max-h-64 overflow-y-auto">
          {loading && <p className="text-xs text-pine/40 px-3 py-2">Searching...</p>}
          {!loading &&
            results.map((g) => (
              <button
                key={g.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(g)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-leaf/40 transition-colors border-b border-leaf/30 last:border-0"
              >
                <div className="font-semibold text-sm text-pine">{g.full_name}</div>
                <div className="text-xs text-pine/50 flex items-center gap-2 mt-0.5">
                  {g.customer_id && (
                    <span className="font-mono bg-pine/10 px-1.5 py-0.5 rounded text-[10px]">
                      {g.customer_id}
                    </span>
                  )}
                  {g.phone && <span>{g.phone}</span>}
                  {g.email && <span className="truncate">{g.email}</span>}
                  {g.loyalty_points > 0 && (
                    <span className="text-forest font-semibold">{g.loyalty_points}pts</span>
                  )}
                </div>
              </button>
            ))}
          {!loading && (
            <div className="border-t border-leaf/40 px-2 py-1.5 flex gap-1.5">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onCreateContact(value.trim(), false)
                  setOpen(false)
                }}
                className="flex-1 text-xs text-forest font-semibold px-2 py-1.5 rounded-lg hover:bg-forest/10 text-left"
              >
                + Create &quot;{value.trim()}&quot;
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onCreateContact(value.trim(), true)
                  setOpen(false)
                }}
                className="flex-1 text-xs text-pine/60 px-2 py-1.5 rounded-lg hover:bg-leaf/40 text-left"
              >
                + Create &amp; edit details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  SERVICE COMBOBOX                                                    */
/* ================================================================== */
function ServiceCombobox({ items, addons, onSelect }) {
  const selectedCount = Object.values(addons).filter((a) => a.selected).length
  const comboboxItems = items.map((it) => ({
    value: it.id,
    label: `${addons[it.id]?.selected ? 'âœ“ ' : ''}${it.name}`,
    sublabel: `${it.unit} Â· ${fmtBDT(it.default_price)}`,
  }))

  return (
    <Combobox
      items={comboboxItems}
      value={undefined}
      onChange={(v) => onSelect(v)}
      placeholder={
        selectedCount > 0
          ? `${selectedCount} service${selectedCount > 1 ? 's' : ''} selected`
          : 'Search and select services...'
      }
      searchPlaceholder="Search services..."
      emptyText="No services found"
      closeOnSelect={false}
    />
  )
}

/* ================================================================== */
/*  NEW RESERVATION FORM                                                */
/* ================================================================== */
const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Engr.']

export function NewReservation({ close, openReservation, userName, prefill }) {
  const t = todayISO()
  const tomorrow = (d) => {
    const dt = new Date(d)
    dt.setDate(dt.getDate() + 1)
    return dt.toISOString().slice(0, 10)
  }

  const [f, setF] = useState({
    salutation: 'Mr.',
    guest_type: 'Individual',
    guest_name: '',
    phone: '',
    email: '',
    address: '',
    reservation_name: '',
    link_names: false,
    company_id: '',
    check_in: t,
    check_out: tomorrow(t),
    pax_adults: 2,
    pax_children: 0,
    source: 'Phone',
    notes: '',
    discount_pct: 0,
    discount_type: 'percentage',
    discount_val: 0,
    commission_pct: 0,
    vat_vds_pct: 0,
    tax_tds_pct: 0,
    vat_mode: 'EXCLUSIVE',
    vip_status: '',
  })

  const [linkedGuest, setLinkedGuest] = useState(null)
  const [rooms, setRooms] = useState([])
  const [companies, setCompanies] = useState([])
  const [booked, setBooked] = useState([])
  const [roomRows, setRoomRows] = useState(() => [
    { room_id: '', from_date: t, to_date: tomorrow(t) },
  ])
  const [taxConfig, setTaxConfig] = useState([])
  const [facilityItems, setFacilityItems] = useState([])
  const [reservationCfg, setReservationCfg] = useState(() => loadReservationConfig())
  const [discountPolicies, setDiscountPolicies] = useState([])
  const [selectedPolicyId, setSelectedPolicyId] = useState('')
  const [reservationPolicy, setReservationPolicy] = useState(null)
  const [policyDiscountPct, setPolicyDiscountPct] = useState(null)
  const [addons, setAddons] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const guestNameRef = useRef(null)
  const [focusGuestName, setFocusGuestName] = useState(false)

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  // Apply prefill data from Booking Calendar (check-in date, check-out date, room)
  useEffect(() => {
    if (!prefill) return
    setF((p) => ({
      ...p,
      ...(prefill.from_date ? { check_in: prefill.from_date } : {}),
      ...(prefill.to_date ? { check_out: prefill.to_date } : {}),
    }))
    if (prefill.room_id && prefill.from_date && prefill.to_date) {
      setRoomRows([
        { room_id: prefill.room_id, from_date: prefill.from_date, to_date: prefill.to_date },
      ])
    }
  }, [prefill])

  const writeAudit = async ({ action, entity, entityId, details = {} }) => {
    try {
      await supabase.from('audit_log').insert({
        actor: userName,
        action,
        entity,
        entity_id: entityId || null,
        details: { ...details, timestamp: new Date().toISOString() },
      })
    } catch {
      // Do not block reservation operations if audit insert fails.
    }
  }

  function getPolicyDiscount(dateStr, policy) {
    if (!policy || !dateStr) return null
    const blackouts = policy.policy_blackout_dates || []
    const isBlackout = blackouts.some((b) => dateStr >= b.from_date && dateStr <= b.to_date)
    if (isBlackout) return Number(policy.blackout_discount_pct)
    const dow = new Date(`${dateStr}T00:00:00`).getDay() // 0=Sun
    const isWeekend = (policy.weekend_days || [4, 5, 6]).includes(dow)
    return isWeekend ? Number(policy.weekend_discount_pct) : Number(policy.weekday_discount_pct)
  }

  async function generateCustomerId() {
    try {
      const { data, error } = await supabase.rpc('generate_customer_id')
      if (error || !data) return null
      return data
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (!reservationPolicy) return
    const disc = getPolicyDiscount(f.check_in, reservationPolicy)
    if (disc !== null && f.discount_type === 'percentage') {
      setPolicyDiscountPct(disc)
      setF((p) => ({ ...p, discount_val: disc }))
    }
  }, [reservationPolicy, f.check_in, f.discount_type])
  const toggleAddon = (key) =>
    setAddons((p) => ({ ...p, [key]: { ...p[key], selected: !p[key].selected } }))
  const updAddon = (key, field, val) =>
    setAddons((p) => ({ ...p, [key]: { ...p[key], [field]: val } }))

  const applyDiscountPolicy = (policyId) => {
    setSelectedPolicyId(policyId)
    const policy = discountPolicies.find((p) => p.id === policyId)
    if (!policy) {
      setF((prev) => ({ ...prev, discount_type: 'percentage', discount_val: 0 }))
      return
    }
    setF((prev) => ({
      ...prev,
      discount_type: policy.type,
      discount_val: policy.value,
      notes:
        policy.note && !prev.notes?.includes(policy.note)
          ? `${prev.notes ? `${prev.notes}\n` : ''}${policy.note}`.trim()
          : prev.notes,
    }))
  }

  const hasBlackoutOverlap = (fromDate, toDate) => {
    if (!fromDate || !toDate || toDate <= fromDate) return false
    const blocked = new Set(reservationCfg.blackoutDays || [])
    return eachNight(fromDate, toDate).some((d) => blocked.has(d))
  }

  const setCheckIn = (val) => {
    // Recalculate policy discount for new check-in date
    if (reservationPolicy) {
      const disc = getPolicyDiscount(val, reservationPolicy)
      if (disc !== null) {
        setPolicyDiscountPct(disc)
        // Only auto-update if user hasn't manually changed discount
        setF((p) => {
          const next = { ...p, check_in: val }
          if (!p.check_out || p.check_out <= val) next.check_out = tomorrow(val)
          // Auto-apply policy discount if discount_type is percentage
          if (p.discount_type === 'percentage') {
            next.discount_val = disc
          }
          return next
        })
        return
      }
    }
    setF((p) => {
      const next = { ...p, check_in: val }
      if (!p.check_out || p.check_out <= val) next.check_out = tomorrow(val)
      return next
    })
  }
  const setReservationName = (val) =>
    setF((p) => ({
      ...p,
      reservation_name: val,
      guest_name: p.link_names ? val : p.guest_name,
    }))
  const toggleLinkNames = (checked) =>
    setF((p) => ({
      ...p,
      link_names: checked,
      guest_name: checked ? p.reservation_name : p.guest_name,
    }))

  const handleGuestSelect = (guest) => {
    setLinkedGuest(guest)
    setF((p) => ({
      ...p,
      guest_name: guest.full_name || '',
      phone: guest.phone || '',
      email: guest.email || '',
      address: guest.address || '',
      reservation_name: p.reservation_name || guest.full_name || '',
    }))
  }

  const createContactFromSearch = async (name, openForEdit = false) => {
    const cleanName = (name || '').trim()
    if (!cleanName) return
    const customerId = await generateCustomerId()
    const { data: g, error } = await supabase
      .from('guests')
      .insert({
        full_name: cleanName,
        customer_id: customerId,
      })
      .select()
      .single()
    if (error) {
      setErr(error.message)
      return
    }

    setLinkedGuest(g)
    setF((p) => ({
      ...p,
      guest_name: g.full_name || cleanName,
      reservation_name: p.reservation_name || g.full_name || cleanName,
      phone: g.phone || '',
      email: g.email || '',
      address: g.address || '',
      link_names: false,
    }))
    if (openForEdit) setFocusGuestName(true)

    await writeAudit({
      action: 'CONTACT_CREATE',
      entity: 'guest',
      entityId: g.customer_id || g.id,
      details: { source: 'RESERVATION_QUERY_SEARCH_CREATE', full_name: g.full_name || cleanName },
    })
  }

  const clearLinkedGuest = () => {
    setLinkedGuest(null)
    setF((p) => ({ ...p, guest_name: '', phone: '', email: '', address: '' }))
  }

  useEffect(() => {
    if (!focusGuestName) return
    guestNameRef.current?.focus()
    setFocusGuestName(false)
  }, [focusGuestName])

  useEffect(() => {
    supabase
      .from('companies')
      .select('id,name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setCompanies(data || []))
    supabase
      .from('tax_config')
      .select('*')
      .then(({ data }) => setTaxConfig(data || []))
    supabase
      .from('discount_policies')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name')
      .then(({ data }) => {
        const policies = data || []
        setDiscountPolicies(policies)
        const def = policies.find((p) => p.is_default) || policies[0]
        if (def) {
          setSelectedPolicyId(def.id)
          setF((prev) => ({
            ...prev,
            discount_type: def.type,
            discount_val: def.value,
            notes:
              def.note && !prev.notes?.includes(def.note)
                ? `${prev.notes ? `${prev.notes}\n` : ''}${def.note}`.trim()
                : prev.notes,
          }))
        }
      })
    supabase
      .from('reservation_policies')
      .select('*, policy_blackout_dates(*)')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setReservationPolicy(data)
      })
    supabase
      .from('facility_items')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        const items = data || []
        setFacilityItems(items)
        setAddons(
          Object.fromEntries(
            items.map((it) => [
              it.id,
              {
                selected: false,
                label: it.name,
                price: String(it.default_price ?? ''),
                qty: 1,
                unit: it.unit,
              },
            ]),
          ),
        )
      })
  }, [])

  useEffect(() => {
    const syncConfig = () => setReservationCfg(loadReservationConfig())
    syncConfig()
    window.addEventListener('focus', syncConfig)
    window.addEventListener('storage', syncConfig)
    return () => {
      window.removeEventListener('focus', syncConfig)
      window.removeEventListener('storage', syncConfig)
    }
  }, [])

  const createCompany = async (name) => {
    const { data, error } = await supabase.from('companies').insert({ name }).select().single()
    if (error) {
      setErr(error.message)
      return null
    }
    setCompanies((p) =>
      [...p, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)),
    )
    await writeAudit({
      action: 'COMPANY_CREATE',
      entity: 'company',
      entityId: data.id,
      details: { name: data.name, source: 'RESERVATION_QUERY' },
    })
    return data.id
  }

  useEffect(() => {
    supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('room_no')
      .then(({ data }) => setRooms(data || []))
    supabase
      .from('reservation_rooms')
      .select('room_id, from_date, to_date, reservations!inner(check_in,check_out,status)')
      .in('reservations.status', ['CONFIRMED', 'CHECKED_IN'])
      .then(({ data }) =>
        setBooked(
          (data || []).map((d) => ({
            room_id: d.room_id,
            ci: d.from_date || d.reservations.check_in,
            co: d.to_date || d.reservations.check_out,
          })),
        ),
      )
  }, [])

  const isBusy = (roomId, from, to) =>
    !!roomId &&
    from &&
    to &&
    to > from &&
    booked.some((b) => b.room_id === roomId && b.ci < to && b.co > from)
  const addRoomRow = () =>
    setRoomRows((p) => [...p, { room_id: '', from_date: f.check_in, to_date: f.check_out }])
  const updRow = (i, k, v) =>
    setRoomRows((p) => p.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)))
  const delRow = (i) => setRoomRows((p) => p.filter((_, idx) => idx !== i))

  const validRows = roomRows.filter(
    (r) => r.room_id && r.from_date && r.to_date && r.to_date > r.from_date,
  )
  const overallCI = validRows.length
    ? validRows.reduce((m, r) => (r.from_date < m ? r.from_date : m), validRows[0].from_date)
    : f.check_in
  const overallCO = validRows.length
    ? validRows.reduce((m, r) => (r.to_date > m ? r.to_date : m), validRows[0].to_date)
    : f.check_out

  const save = async () => {
    setBusy(true)
    setErr('')
    try {
      if (!f.reservation_name) throw new Error('Reservation Name is required')
      if (!f.guest_name) throw new Error('Guest Name is required')
      if (validRows.length === 0 && f.check_out <= f.check_in)
        throw new Error('Check-out must be after check-in')
      if (hasBlackoutOverlap(overallCI, overallCO))
        throw new Error('Selected stay window includes blackout day(s). Please adjust dates.')
      for (const r of validRows) {
        if (hasBlackoutOverlap(r.from_date, r.to_date)) {
          const rm = rooms.find((x) => x.id === r.room_id)
          throw new Error(`Room ${rm?.room_no || ''} dates include configured blackout day(s).`)
        }
        if (isBusy(r.room_id, r.from_date, r.to_date)) {
          const rm = rooms.find((x) => x.id === r.room_id)
          throw new Error(
            `Room ${rm?.room_no} is already booked for ${r.from_date} â†’ ${r.to_date}`,
          )
        }
      }

      let guestId = linkedGuest?.id || null

      if (guestId) {
        await supabase
          .from('guests')
          .update({
            full_name: f.guest_name,
            phone: f.phone || linkedGuest.phone,
            email: f.email || linkedGuest.email,
            address: f.address || linkedGuest.address,
          })
          .eq('id', guestId)
        await writeAudit({
          action: 'CONTACT_EDIT',
          entity: 'guest',
          entityId: linkedGuest?.customer_id || guestId,
          details: { source: 'RESERVATION_QUERY_SAVE', full_name: f.guest_name },
        })
      } else {
        const customerId = await generateCustomerId()
        const { data: g, error: ge } = await supabase
          .from('guests')
          .insert({
            full_name: f.guest_name,
            phone: f.phone,
            email: f.email,
            address: f.address,
            customer_id: customerId,
          })
          .select()
          .single()
        if (ge) throw ge
        guestId = g.id
        await writeAudit({
          action: 'CONTACT_CREATE',
          entity: 'guest',
          entityId: g.customer_id || g.id,
          details: { source: 'RESERVATION_QUERY_SAVE', full_name: g.full_name },
        })
      }

      const firstRoom = validRows.length ? rooms.find((r) => r.id === validRows[0].room_id) : null
      const { data: r, error: re } = await supabase
        .from('reservations')
        .insert({
          salutation: f.salutation,
          guest_type: f.guest_type,
          vip_status: f.vip_status || null,
          reservation_name: f.reservation_name || f.guest_name,
          company_id: f.guest_type === 'Company' ? f.company_id || null : null,
          primary_guest_id: guestId,
          check_in: overallCI,
          check_out: overallCO,
          pax_adults: +f.pax_adults,
          pax_children: +f.pax_children,
          discount_pct: f.discount_type === 'percentage' ? +f.discount_val || 0 : 0,
          discount_type: f.discount_type,
          discount_val: +f.discount_val || 0,
          room_rate: firstRoom ? firstRoom.base_rate : null,
          commission_pct: f.guest_type === 'Company' ? +f.commission_pct || 0 : 0,
          vat_vds_pct: f.guest_type === 'Company' ? +f.vat_vds_pct || 0 : 0,
          tax_tds_pct: f.guest_type === 'Company' ? +f.tax_tds_pct || 0 : 0,
          source: f.source,
          notes: f.notes,
          vat_mode: f.vat_mode,
          created_by: userName,
        })
        .select()
        .single()
      if (re) throw re

      await writeAudit({
        action: 'RESERVATION_QUERY_CREATE',
        entity: 'reservation',
        entityId: r.res_no || r.id,
        details: {
          reservation_id: r.id,
          reservation_name: r.reservation_name,
          guest_name: f.guest_name,
          guest_type: f.guest_type,
          check_in: overallCI,
          check_out: overallCO,
          source: f.source,
        },
      })

      await supabase
        .from('reservation_guests')
        .insert({ reservation_id: r.id, guest_name: f.guest_name, is_primary: true })

      if (validRows.length > 0) {
        await supabase.from('reservation_rooms').insert(
          validRows.map((row) => {
            const rm = rooms.find((x) => x.id === row.room_id)
            return {
              reservation_id: r.id,
              room_id: row.room_id,
              rate: rm?.base_rate || 0,
              from_date: row.from_date,
              to_date: row.to_date,
            }
          }),
        )
        await writeAudit({
          action: 'RESERVATION_ROOM_ASSIGN',
          entity: 'reservation',
          entityId: r.res_no || r.id,
          details: {
            reservation_id: r.id,
            room_count: validRows.length,
            rooms: validRows.map((row) => {
              const rm = rooms.find((x) => x.id === row.room_id)
              return {
                room_id: row.room_id,
                room_no: rm?.room_no || null,
                from_date: row.from_date,
                to_date: row.to_date,
              }
            }),
          },
        })
      }

      const selectedAddons = facilityItems
        .filter((it) => addons[it.id]?.selected)
        .map((it) => ({
          reservation_id: r.id,
          item_key: it.id,
          label: addons[it.id].label || it.name,
          price: +addons[it.id].price || 0,
          qty: +addons[it.id].qty || 1,
          posted: false,
          created_by: userName,
        }))
      if (selectedAddons.length > 0) {
        const { error: ae } = await supabase.from('reservation_addons').insert(selectedAddons)
        if (ae) throw ae
        await writeAudit({
          action: 'RESERVATION_ADDON_SELECT',
          entity: 'reservation',
          entityId: r.res_no || r.id,
          details: {
            reservation_id: r.id,
            addons: selectedAddons.map((a) => ({ label: a.label, qty: a.qty, price: a.price })),
          },
        })
      }

      try {
        const qRate = rateFor(taxConfig, 'ROOM', overallCI)
        const roomTotal = firstRoom ? Number(firstRoom.base_rate) : 0
        const nightsCount = nightsBetween(overallCI, overallCO) || 1
        const discDescriptor =
          f.discount_type === 'fixed'
            ? { type: 'fixed', value: +f.discount_val || 0 }
            : +f.discount_val || 0
        const perNight = computeCharge(roomTotal, discDescriptor, qRate)
        const grandTotal = +(perNight.total * nightsCount).toFixed(2)
        const validUntil = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
        const { data: qSeq } = await supabase.rpc('next_tenant_seq', { p_seq_name: 'quotation' })
        const quoteNo = `Q-${String(qSeq || 1).padStart(4, '0')}`
        await supabase.from('quotations').insert({
          reservation_id: r.id,
          quote_no: quoteNo,
          total_amount: grandTotal,
          valid_until: validUntil,
          room_rate: roomTotal,
          room_count: validRows.length,
          discount_pct: f.discount_type === 'percentage' ? +f.discount_val || 0 : 0,
          status: 'DRAFT',
          message: '',
        })
      } catch (qErr) {
        console.error('Auto-quotation failed (non-fatal):', qErr)
      }

      close()
      openReservation(r.id)
    } catch (e) {
      setErr(e.message)
    }
    setBusy(false)
  }

  // Shared field wrapper: label + control stacked
  const F = ({ label, children, className, hint }) => (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="text-xs font-semibold text-pine/70 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <span className="text-[11px] text-pine/40">{hint}</span>}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-0">
      <div className="max-w-2xl mx-auto space-y-3.5">
        {/* â”€â”€ Header â”€â”€ */}
        <div>
          <h2 className="font-display text-xl font-bold text-pine">New Reservation Query</h2>
          <p className="text-sm text-pine/50 mt-0.5">
            Fill in guest and stay details to create a booking query.
          </p>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SECTION 1 â€” Guest Details
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-leaf/40 bg-leaf/10">
            <User size={14} className="text-forest" />
            <span className="text-sm font-semibold text-pine">Guest Details</span>
          </div>

          <div className="p-5 space-y-3">
            {/* Row 1: Salutation (narrow) + Guest Type (fills rest) â€” single flex row */}
            <div className="flex items-end gap-3">
              <F label="Salutation" className="w-32 shrink-0">
                <SearchableSelect
                  options={SALUTATIONS.map((s) => ({ value: s, label: s }))}
                  value={f.salutation}
                  onChange={(val) => set('salutation', val)}
                  placeholder="Select..."
                />
              </F>

              <F label="Guest Type" className="flex-1">
                <div className="flex gap-1.5 h-9">
                  {[
                    { v: 'Individual', icon: <User size={13} /> },
                    { v: 'Company', icon: <Building2 size={13} /> },
                  ].map(({ v, icon }) => (
                    <Button
                      key={v}
                      type="button"
                      variant={f.guest_type === v ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => set('guest_type', v)}
                      className={cn(
                        'flex-1 h-full justify-center gap-1.5 rounded-xl text-sm font-semibold',
                        f.guest_type === v
                          ? 'border-[rgb(var(--tenant-primary-rgb)_/_0.30)] text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]'
                          : 'border-leaf bg-white text-pine/70 hover:border-forest/40 hover:text-pine',
                      )}
                    >
                      {icon}
                      {v}
                    </Button>
                  ))}
                </div>
              </F>
            </div>

            {/* Row 2: Reservation Name | Guest Name */}
            <div className="grid grid-cols-2 gap-3">
              <F
                label={
                  f.guest_type === 'Company' ? 'Reservation / Company Name *' : 'Reservation Name *'
                }
              >
                <input
                  className="input"
                  value={f.reservation_name}
                  onChange={(e) => setReservationName(e.target.value)}
                  placeholder={
                    f.guest_type === 'Company' ? 'e.g. Acme Corporation' : 'e.g. Hasan Family'
                  }
                />
              </F>

              <F label="Guest Name *">
                <div className="flex items-center justify-end -mt-5 mb-1">
                  <label className="flex items-center gap-1.5 text-[11px] text-pine/50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3 h-3 accent-forest"
                      checked={f.link_names}
                      onChange={(e) => toggleLinkNames(e.target.checked)}
                      disabled={!!linkedGuest}
                    />
                    Same as reservation name
                  </label>
                </div>
                {linkedGuest ? (
                  <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-forest/10 border border-forest/20">
                    <CheckCircle2 size={13} className="text-forest shrink-0" />
                    <span className="text-sm font-semibold text-pine flex-1 truncate">
                      {linkedGuest.full_name}
                    </span>
                    {linkedGuest.customer_id && (
                      <span className="font-mono text-[10px] bg-pine/10 text-pine/60 px-1.5 rounded shrink-0">
                        {linkedGuest.customer_id}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={clearLinkedGuest}
                      className="text-pine/30 hover:text-red-500 shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <GuestInlineSearch
                    value={f.guest_name}
                    disabled={f.link_names}
                    onChange={(v) => set('guest_name', v)}
                    onSelect={handleGuestSelect}
                    onCreateContact={createContactFromSearch}
                    inputRef={guestNameRef}
                    placeholder={
                      f.link_names ? 'Pulled from reservation name' : 'Search or create guest...'
                    }
                  />
                )}
              </F>
            </div>

            {/* Row 3: Phone | Email */}
            <div className="grid grid-cols-2 gap-3">
              <F label="Phone (WhatsApp)">
                <input
                  className="input"
                  placeholder="01XXXXXXXXX"
                  value={f.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </F>
              <F label="Email">
                <input
                  className="input"
                  type="email"
                  value={f.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </F>
            </div>

            {/* Row 4: Address */}
            <F label="Address">
              <input
                className="input"
                value={f.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="City, Country"
              />
            </F>

            {/* Company-only fields */}
            {f.guest_type === 'Company' && (
              <F label="Company">
                <SearchableSelect
                  options={companies.map((c) => ({ value: c.id, label: c.name }))}
                  value={f.company_id}
                  onChange={(val) => {
                    set('company_id', val)
                    const c = companies.find((x) => x.id === val)
                    if (c) setReservationName(c.name)
                  }}
                  placeholder="Search or add a company..."
                  allowCreate
                  onCreate={createCompany}
                  clearable
                />
              </F>
            )}
            {f.guest_type === 'Company' && (
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-leaf/20 border border-leaf">
                {[
                  ['Commission %', 'commission_pct'],
                  ['VAT/VDS %', 'vat_vds_pct'],
                  ['Tax/TDS %', 'tax_tds_pct'],
                ].map(([lbl, key]) => (
                  <F key={key} label={lbl}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input money text-right"
                      value={f[key]}
                      onChange={(e) => set(key, e.target.value)}
                    />
                  </F>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SECTION 2 â€” Stay Details
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-leaf/40 bg-leaf/10">
            <CalendarDays size={14} className="text-forest" />
            <span className="text-sm font-semibold text-pine">Stay Details</span>
          </div>

          <div className="p-5 space-y-3">
            {/* Check-in | Check-out | Pax */}
            <div className="grid grid-cols-4 gap-3">
              <F label="Check-in *" hint={dayName(f.check_in)}>
                <input
                  type="date"
                  className="input"
                  value={f.check_in}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </F>
              <F label="Check-out *" hint={dayName(f.check_out)}>
                <input
                  type="date"
                  className="input"
                  value={f.check_out}
                  onChange={(e) => set('check_out', e.target.value)}
                />
              </F>
              <F label="Adults">
                <input
                  type="number"
                  min="1"
                  className="input text-center"
                  value={f.pax_adults}
                  onChange={(e) => set('pax_adults', e.target.value)}
                />
              </F>
              <F label="Children">
                <input
                  type="number"
                  min="0"
                  className="input text-center"
                  value={f.pax_children}
                  onChange={(e) => set('pax_children', e.target.value)}
                />
              </F>
            </div>

            {/* Source | VIP */}
            <div className="grid grid-cols-2 gap-3">
              <F label="Source">
                <SearchableSelect
                  options={[
                    'Phone',
                    'WhatsApp',
                    'Facebook',
                    'Walk-in',
                    'Email',
                    'OTA',
                    'Agent',
                  ].map((s) => ({ value: s, label: s }))}
                  value={f.source}
                  onChange={(val) => set('source', val)}
                  placeholder="Select..."
                />
              </F>
              <F label="VIP Status">
                <div className="flex gap-1.5 h-9">
                  {[
                    { v: '', label: 'None' },
                    { v: 'VIP', label: 'VIP' },
                    { v: 'VVIP', label: 'VVIP' },
                  ].map((opt) => (
                    <Button
                      key={opt.v}
                      type="button"
                      variant={f.vip_status === opt.v ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => set('vip_status', opt.v)}
                      className={cn(
                        'flex-1 h-full rounded-xl text-xs font-semibold',
                        f.vip_status === opt.v
                          ? 'border-[rgb(var(--tenant-primary-rgb)_/_0.30)] text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]'
                          : 'border-leaf bg-white text-pine/60 hover:border-forest/40',
                      )}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </F>
            </div>

            {/* Rooms */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-pine/70 uppercase tracking-wide flex items-center gap-1.5">
                  <BedDouble size={13} className="text-forest" /> Rooms
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={addRoomRow}
                  className="h-7 rounded-lg border-leaf px-2.5 text-xs font-semibold text-forest hover:text-pine"
                >
                  <Plus size={12} /> Add room
                </Button>
              </div>
              <div className="space-y-2">
                {roomRows.map((row, i) => {
                  const taken = isBusy(row.room_id, row.from_date, row.to_date)
                  return (
                    <div
                      key={i}
                      className={cn(
                        'grid grid-cols-12 gap-2 items-start p-2.5 rounded-xl border',
                        taken ? 'border-red-300 bg-red-50/50' : 'border-leaf/60 bg-leaf/5',
                      )}
                    >
                      <div className="col-span-5">
                        <SearchableSelect
                          options={rooms.map((rm) => ({
                            value: rm.id,
                            label: `${rm.room_no}${rm.room_name ? ` Â· ${rm.room_name}` : ''}`,
                            sublabel: `${rm.room_type} Â· ${fmtBDT(rm.base_rate)}`,
                          }))}
                          value={row.room_id}
                          onChange={(val) => updRow(i, 'room_id', val)}
                          placeholder="Select room..."
                          clearable
                          className={taken ? 'ring-1 ring-red-400 rounded-lg' : ''}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="date"
                          className="input !text-xs"
                          value={row.from_date}
                          onChange={(e) => updRow(i, 'from_date', e.target.value)}
                        />
                        <span className="text-[10px] text-pine/40 pl-1">
                          {dayName(row.from_date)}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="date"
                          className="input !text-xs"
                          value={row.to_date}
                          onChange={(e) => updRow(i, 'to_date', e.target.value)}
                        />
                        <span className="text-[10px] text-pine/40 pl-1">
                          {dayName(row.to_date)}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => delRow(i)}
                          className="text-pine/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {taken && (
                        <p className="col-span-12 text-xs text-red-600 -mt-1 pl-1">
                          âš  Room already booked for these dates.
                        </p>
                      )}
                    </div>
                  )
                })}
                {roomRows.length === 0 && (
                  <p className="text-xs text-pine/40 py-2 text-center border border-dashed border-leaf rounded-xl">
                    No rooms added â€” leave empty to save as a query.
                  </p>
                )}
                {rooms.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No rooms defined â€” add room inventory in Settings first.
                  </p>
                )}
              </div>
              {validRows.length > 0 && (
                <p className="text-xs text-pine/50 mt-2">
                  Stay:{' '}
                  <b className="text-pine">
                    {overallCI} â†’ {overallCO}
                  </b>{' '}
                  Â· {validRows.length} room(s)
                </p>
              )}
            </div>

            {/* Notes */}
            <F label="Notes / Special Requests">
              <textarea
                className="input"
                rows={2}
                value={f.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Special requests, notes..."
              />
            </F>
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SECTION 3 â€” Pricing
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-leaf/40 bg-leaf/10">
            <SlidersHorizontal size={14} className="text-forest" />
            <span className="text-sm font-semibold text-pine">Pricing & Discount</span>
          </div>

          <div className="p-5 space-y-3">
            {/* VAT Mode */}
            <F label="VAT on Room Charges">
              <div className="flex gap-2">
                {[
                  { v: 'EXCLUSIVE', label: 'VAT Exclusive', hint: 'Added on top' },
                  { v: 'INCLUSIVE', label: 'VAT Inclusive', hint: 'Included in rate' },
                  { v: 'NONE', label: 'No VAT', hint: 'Not applicable' },
                ].map((opt) => (
                  <Button
                    key={opt.v}
                    type="button"
                    variant={f.vat_mode === opt.v ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set('vat_mode', opt.v)}
                    className={cn(
                      'flex-1 h-auto rounded-xl px-3 py-2 text-left',
                      f.vat_mode === opt.v
                        ? 'border-[rgb(var(--tenant-primary-rgb)_/_0.30)] text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]'
                        : 'border-leaf bg-white text-pine/70 hover:border-forest/40',
                    )}
                  >
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div
                      className={cn(
                        'text-[11px] mt-0.5',
                        f.vat_mode === opt.v ? 'text-white/70' : 'text-pine/40',
                      )}
                    >
                      {opt.hint}
                    </div>
                  </Button>
                ))}
              </div>
            </F>

            {/* Discount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-pine/70 uppercase tracking-wide flex items-center gap-1.5">
                  <Percent size={12} className="text-forest" /> Discount
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {reservationPolicy && policyDiscountPct !== null && (
                    <span className="text-xs text-forest font-semibold bg-forest/10 border border-forest/20 px-2.5 py-0.5 rounded-full">
                      ðŸ“…{' '}
                      {(() => {
                        const dow = new Date(`${f.check_in}T00:00:00`).getDay()
                        const blackouts = reservationPolicy.policy_blackout_dates || []
                        const isBlackout = blackouts.some(
                          (b) => f.check_in >= b.from_date && f.check_in <= b.to_date,
                        )
                        if (isBlackout) return `Blackout â€” ${policyDiscountPct}% auto`
                        return (reservationPolicy.weekend_days || [4, 5, 6]).includes(dow)
                          ? `Weekend â€” ${policyDiscountPct}% auto`
                          : `Weekday â€” ${policyDiscountPct}% auto`
                      })()}
                    </span>
                  )}
                  {selectedPolicyId &&
                    (() => {
                      const policy = discountPolicies.find((p) => p.id === selectedPolicyId)
                      return policy ? (
                        <span className="text-xs text-pine/60 flex items-center gap-1 bg-leaf/30 border border-leaf px-2 py-0.5 rounded-full">
                          âœ“ {policy.name}
                          <button
                            type="button"
                            onClick={() => applyDiscountPolicy('')}
                            className="text-pine/30 hover:text-red-500 ml-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ) : null
                    })()}
                  {!selectedPolicyId && discountPolicies.length > 0 && (
                    <div className="w-40">
                      <Combobox
                        items={discountPolicies.map((p) => ({
                          value: p.id,
                          label: p.name,
                          sublabel: p.type === 'fixed' ? `à§³${p.value}` : `${p.value}%`,
                        }))}
                        value=""
                        onChange={(v) => applyDiscountPolicy(v)}
                        placeholder="Apply policy..."
                        searchPlaceholder="Search..."
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl border border-leaf bg-leaf/5">
                <div className="flex gap-1 shrink-0">
                  {[
                    { v: 'percentage', label: '%' },
                    { v: 'fixed', label: 'à§³ Fixed' },
                  ].map((opt) => (
                    <Button
                      key={opt.v}
                      type="button"
                      variant={f.discount_type === opt.v ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => set('discount_type', opt.v)}
                      className={cn(
                        'h-8 rounded-lg px-3 text-xs font-semibold',
                        f.discount_type === opt.v
                          ? 'border-[rgb(var(--tenant-primary-rgb)_/_0.30)] text-white shadow-[0_6px_14px_rgba(15,23,42,0.10)]'
                          : 'border-leaf bg-white text-pine/60 hover:border-forest/40',
                      )}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  max={f.discount_type === 'percentage' ? 100 : undefined}
                  className="input money flex-1"
                  placeholder={f.discount_type === 'percentage' ? '0' : '0.00'}
                  value={f.discount_val}
                  onChange={(e) => set('discount_val', e.target.value)}
                />
                <span className="text-sm font-semibold text-pine/50 shrink-0 w-6">
                  {f.discount_type === 'percentage' ? '%' : 'BDT'}
                </span>
              </div>
            </div>

            {/* Included Services */}
            {facilityItems.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-pine/70 uppercase tracking-wide block mb-1.5">
                  Included Services
                </label>
                <ServiceCombobox items={facilityItems} addons={addons} onSelect={toggleAddon} />
                {Object.values(addons).some((a) => a.selected) && (
                  <div className="space-y-1.5 mt-2">
                    {facilityItems
                      .filter((it) => addons[it.id]?.selected)
                      .map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-forest/20 bg-forest/5"
                        >
                          <span className="text-sm flex-1 font-medium text-pine">
                            {it.name}
                            <span className="text-pine/40 text-xs ml-1">/{it.unit}</span>
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input !h-7 !w-24 money text-right"
                            placeholder="Price à§³"
                            value={addons[it.id].price}
                            onChange={(e) => updAddon(it.id, 'price', e.target.value)}
                          />
                          <input
                            type="number"
                            min="1"
                            className="input !h-7 !w-14 text-center"
                            placeholder="Qty"
                            value={addons[it.id].qty}
                            onChange={(e) => updAddon(it.id, 'qty', e.target.value)}
                          />
                          <button
                            onClick={() => toggleAddon(it.id)}
                            className="text-pine/20 hover:text-red-500 shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {err && (
          <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
            {err}
          </div>
        )}

        {/* â”€â”€ Footer â”€â”€ */}
        <div className="flex justify-end gap-3 pb-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={close}
            className="h-9 rounded-xl px-5 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={save}
            disabled={busy}
            className="h-9 rounded-xl px-6 text-sm"
          >
            {busy ? 'Saving...' : 'Create Query'}
          </Button>
        </div>
      </div>
    </div>
  )
}
