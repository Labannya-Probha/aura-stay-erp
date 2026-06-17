import { supabase } from '../supabase'   // file lives at src/lib/pms.api.js; supabase.js is at src/supabase.js

/* ---------- Company / config ---------- */
export const getCompany   = () => supabase.from('company_settings').select('*').order('id').limit(1).single()
export const getTaxConfig = () => supabase.from('tax_config').select('*')

/* ---------- Reservations ---------- */
export const listReservations = () =>
  supabase.from('reservations')
    .select('id,res_no,reservation_name,status,check_in,check_out,pax_adults,pax_children,source,created_at, guests:primary_guest_id(full_name,phone), reservation_rooms(rooms(room_no,room_name))')
    .order('created_at', { ascending: false }).limit(300)

export const getReservation = (id) =>
  supabase.from('reservations').select('*, agencies(*), shareholders(*)').eq('id', id).single()

export const createReservation = (row) =>
  supabase.from('reservations').insert(row).select().single()

export const updateReservation = (id, patch) =>
  supabase.from('reservations').update(patch).eq('id', id)

export const setReservationStatus = (id, status, extra = {}) =>
  supabase.from('reservations').update({ status, ...extra }).eq('id', id)

/* ---------- Guests ---------- */
export const getGuest    = (id)        => supabase.from('guests').select('*').eq('id', id).single()
export const createGuest = (row)       => supabase.from('guests').insert(row).select().single()
export const updateGuest = (id, patch) => supabase.from('guests').update(patch).eq('id', id)

/* ---------- Reservation guests (names on the reg card) ---------- */
export const getReservationGuests = (resId) =>
  supabase.from('reservation_guests').select('*').eq('reservation_id', resId).order('is_primary', { ascending: false })
export const addReservationGuest    = (row) => supabase.from('reservation_guests').insert(row)
export const removeReservationGuest = (id)  => supabase.from('reservation_guests').delete().eq('id', id)

/* ---------- Move / shift bookings (calendar drag) ---------- */
// Move or resize one room booking. rrId = reservation_rooms.id
export const moveBooking = ({ rrId, room_id, from_date, to_date }) => {
  const patch = {}
  if (room_id   !== undefined) patch.room_id   = room_id
  if (from_date !== undefined) patch.from_date = from_date
  if (to_date   !== undefined) patch.to_date   = to_date
  return supabase.from('reservation_rooms')
    .update(patch).eq('id', rrId)
    .select('*, rooms(*)').single()
}

// Is the target room free for that window? Excludes the row being moved.
export const isRoomFree = async ({ room_id, from_date, to_date, exclude_rr_id }) => {
  const { data, error } = await supabase
    .from('reservation_rooms')
    .select('id, from_date, to_date, reservations!inner(check_in,check_out,status)')
    .eq('room_id', room_id)
    .in('reservations.status', ['CONFIRMED', 'CHECKED_IN'])
  if (error) return { free: false, error }
  const clash = (data || []).some((b) => {
    if (b.id === exclude_rr_id) return false
    const ci = b.from_date || b.reservations.check_in
    const co = b.to_date   || b.reservations.check_out
    return ci < to_date && co > from_date
  })
  return { free: !clash, error: null }
}

// Recompute reservations.check_in/out from its room rows after a move
export const syncReservationWindow = async (reservation_id) => {
  const { data } = await supabase.from('reservation_rooms')
    .select('from_date,to_date').eq('reservation_id', reservation_id)
  if (!data?.length) return
  const ci = data.reduce((m, r) => (r.from_date < m ? r.from_date : m), data[0].from_date)
  const co = data.reduce((m, r) => (r.to_date   > m ? r.to_date   : m), data[0].to_date)
  await supabase.from('reservations').update({ check_in: ci, check_out: co }).eq('id', reservation_id)
}
/* ---------- Rooms & availability ---------- */
export const getActiveRooms = () =>
  supabase.from('rooms').select('*').eq('is_active', true).order('room_no')

// occupancy for double-booking checks (CONFIRMED / CHECKED_IN stays)
export const getOccupancy = () =>
  supabase.from('reservation_rooms')
    .select('room_id, from_date, to_date, reservations!inner(check_in,check_out,status)')
    .in('reservations.status', ['CONFIRMED', 'CHECKED_IN'])

/* ---------- Reservation rooms (assignments) ---------- */
export const getReservationRooms = (resId) =>
  supabase.from('reservation_rooms').select('*, rooms(*)').eq('reservation_id', resId)
export const addReservationRoom    = (row)        => supabase.from('reservation_rooms').insert(row)
export const addReservationRooms   = (rows)       => supabase.from('reservation_rooms').insert(rows)
export const updateReservationRoom = (id, patch)  => supabase.from('reservation_rooms').update(patch).eq('id', id)
export const removeReservationRoom = (id)         => supabase.from('reservation_rooms').delete().eq('id', id)

/* ---------- Folio charges ---------- */
export const getFolioCharges = (resId) =>
  supabase.from('folio_charges').select('*').eq('reservation_id', resId).order('charge_date')
export const addFolioCharge   = (row)  => supabase.from('folio_charges').insert(row)
export const addFolioCharges  = (rows) => supabase.from('folio_charges').insert(rows)
export const setChargeStatus  = (id, status) => supabase.from('folio_charges').update({ status }).eq('id', id)
export const deleteFolioCharge = (id)  => supabase.from('folio_charges').delete().eq('id', id)
export const deleteFolioChargesByType = (resId, charge_type) =>
  supabase.from('folio_charges').delete().eq('reservation_id', resId).eq('charge_type', charge_type)

/* ---------- Payments ---------- */
export const getPayments  = (resId) =>
  supabase.from('payments').select('*').eq('reservation_id', resId).order('received_date')
export const addPayment    = (row) => supabase.from('payments').insert(row)
export const deletePayment = (id)  => supabase.from('payments').delete().eq('id', id)

/* ---------- Invoices ---------- */
export const getInvoices = (resId) =>
  supabase.from('invoices').select('*').eq('reservation_id', resId).order('created_at', { ascending: false })
export const getActiveInvoice = (resId) =>
  supabase.from('invoices').select('id, totals').eq('reservation_id', resId).eq('is_void', false).maybeSingle()
export const createInvoice = (row)       => supabase.from('invoices').insert(row)
export const updateInvoice = (id, patch) => supabase.from('invoices').update(patch).eq('id', id)
export const voidReservationInvoices = (resId, patch) =>
  supabase.from('invoices').update(patch).eq('reservation_id', resId).not('is_void', 'is', true)

/* ---------- Quotations ---------- */
export const getQuotations = (resId) =>
  supabase.from('quotations').select('*').eq('reservation_id', resId).order('created_at', { ascending: false })
export const addQuotation = (row) => supabase.from('quotations').insert(row)

/* ---------- Partners (legacy agency / shareholder — until Module 1 partner tables) ---------- */
export const updateAgencyDue = (id, due_balance) =>
  supabase.from('agencies').update({ due_balance }).eq('id', id)
export const updateShareholderBalance = (id, free_stay_balance) =>
  supabase.from('shareholders').update({ free_stay_balance }).eq('id', id)

/* ---------- Audit (shared; lives here for now, can move to /lib/audit.js) ---------- */
export const logAudit = (entry) => supabase.from('audit_log').insert(entry)

/* ============================================================================
   TODO — add when you share these files:
   • BookingCalendar.jsx  → getCalendarOccupancy(range), etc.
   • HousekeepingHub.jsx  → getHousekeepingTasks(), setRoomStatus(roomId, status), etc.
   ============================================================================ */
