import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmtBDT, fmtDate, todayISO, nightsBetween, rateFor, computeCharge } from '../lib/helpers'
import { generateReservationPaymentNo } from '../lib/paymentNumber'
import { ArrowLeft, MessageCircle, Mail, Plus, Trash2, Printer, Pencil, Save } from 'lucide-react'
import Quotation from '../components/print/Quotation.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'

export default function ReservationQuotationTab({
  res,
  guest,
  resRooms,
  addons = [],
  taxConfig = [],
  company,
  nights,
  reload,
  flash,
  setPrintDoc,
}) {
  const [quote, setQuote] = useState(null)
  const [quoteEditorOpen, setQuoteEditorOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [roomsAll, setRoomsAll] = useState([])
  const [roomList, setRoomList] = useState([])
  const [addonList, setAddonList] = useState([])
  const [newAddon, setNewAddon] = useState({ label: '', price: '', qty: 1 })
  const [editForm, setEditForm] = useState({
    salutation: res.salutation || '',
    full_name: guest?.full_name || '',
    phone: guest?.phone || '',
    email: guest?.email || '',
    address: guest?.address || '',
    check_in: res.check_in,
    check_out: res.check_out,
    pax_adults: res.pax_adults || 1,
    pax_children: res.pax_children || 0,
    source: res.source || '',
    reservation_name: res.reservation_name || '',
    use_reservation_name_only: res.use_reservation_name_only || false,
    guest_type: res.guest_type || 'Individual',
    notes: res.notes || '',
    discount_type: res.discount_type || 'percentage',
    discount_val: res.discount_val || 0,
    discount_pct: res.discount_pct || 0,
    terms_conditions: res.terms_conditions || company?.terms_conditions || '',
  })

  const loadLatestQuote = async () => {
    const { data } = await supabase
      .from('quotations')
      .select('*')
      .eq('reservation_id', res.id)
      .order('created_at', { ascending: false })
      .limit(1)
    setQuote(data?.[0] || null)
  }

  useEffect(() => { loadLatestQuote() }, [res.id])

  useEffect(() => {
    if (!quoteEditorOpen) return
    supabase.from('rooms').select('*').eq('is_active', true).order('room_no')
      .then(({ data }) => setRoomsAll(data || []))
  }, [quoteEditorOpen])

  const openQuoteEditor = (editExisting = false) => {
    setEditing(editExisting)
    setEditForm({
      salutation: res.salutation || '',
      full_name: guest?.full_name || '',
      phone: guest?.phone || '',
      email: guest?.email || '',
      address: guest?.address || '',
      check_in: res.check_in,
      check_out: res.check_out,
      pax_adults: res.pax_adults || 1,
      pax_children: res.pax_children || 0,
      source: res.source || '',
      reservation_name: res.reservation_name || '',
      use_reservation_name_only: res.use_reservation_name_only || false,
      guest_type: res.guest_type || 'Individual',
      notes: res.notes || '',
      discount_type: res.discount_type || 'percentage',
      discount_val: res.discount_val || 0,
      discount_pct: res.discount_pct || 0,
      terms_conditions: res.terms_conditions || company?.terms_conditions || '',
    })
    setRoomList(resRooms.map((rr) => ({
      id: rr.id,
      room_id: rr.room_id,
      room_no: rr.rooms?.room_no,
      room_name: rr.rooms?.room_name,
      room_type: rr.rooms?.room_type,
      rate: rr.rate || rr.rooms?.base_rate || 0,
      from_date: rr.from_date,
      to_date: rr.to_date,
    })))
    setAddonList(addons.map((item) => ({ ...item })))
    setNewAddon({ label: '', price: '', qty: 1 })
    setQuoteEditorOpen(true)
  }

  const assignRoomInModal = (room) => setRoomList((prev) => [...prev, {
    id: null,
    room_id: room.id,
    room_no: room.room_no,
    room_name: room.room_name,
    room_type: room.room_type,
    rate: room.base_rate || 0,
    from_date: editForm.check_in,
    to_date: editForm.check_out,
  }])

  const removeRoomInModal = (idx) => setRoomList((prev) => prev.filter((_, i) => i !== idx))
  const updateRoomRateInModal = (idx, value) => setRoomList((prev) => prev.map((room, i) => (i === idx ? { ...room, rate: Number(value) } : room)))

  const addAddonItem = () => {
    if (!newAddon.label || !newAddon.price) return
    setAddonList((prev) => [...prev, {
      id: null,
      label: newAddon.label,
      price: Number(newAddon.price),
      qty: Number(newAddon.qty) || 1,
      posted: false,
      reservation_id: res.id,
    }])
    setNewAddon({ label: '', price: '', qty: 1 })
  }

  const removeAddonItem = (idx) => setAddonList((prev) => prev.filter((_, i) => i !== idx))

  const handleUpdateQuotation = async () => {
    if (guest) {
      await supabase.from('guests').update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
      }).eq('id', guest.id)
    }

    const resUpdate = {
      salutation: editForm.salutation,
      check_in: editForm.check_in,
      check_out: editForm.check_out,
      pax_adults: Number(editForm.pax_adults),
      pax_children: Number(editForm.pax_children),
      source: editForm.source,
      reservation_name: editForm.reservation_name,
      use_reservation_name_only: editForm.use_reservation_name_only,
      guest_type: editForm.guest_type,
      notes: editForm.notes,
      discount_type: editForm.discount_type,
      discount_val: editForm.discount_type === 'fixed' ? Number(editForm.discount_val) : 0,
      discount_pct: editForm.discount_type === 'percentage' ? Number(editForm.discount_pct) : 0,
      terms_conditions: editForm.terms_conditions,
      room_rate: roomList.length > 0 ? roomList[0].rate : 0,
    }
    const { error: resErr } = await supabase.from('reservations').update(resUpdate).eq('id', res.id)
    if (resErr) { flash(resErr.message); return }

    const currentRoomIds = resRooms.map((rr) => rr.id)
    const newRoomIds = roomList.map((room) => room.id).filter((roomId) => roomId !== null)
    const roomsToDelete = currentRoomIds.filter((roomId) => !newRoomIds.includes(roomId))
    if (roomsToDelete.length) await supabase.from('reservation_rooms').delete().in('id', roomsToDelete)
    for (const room of roomList) {
      if (room.id) {
        await supabase.from('reservation_rooms').update({
          room_id: room.room_id,
          rate: room.rate,
          from_date: room.from_date || editForm.check_in,
          to_date: room.to_date || editForm.check_out,
        }).eq('id', room.id)
      } else {
        await supabase.from('reservation_rooms').insert({
          reservation_id: res.id,
          room_id: room.room_id,
          rate: room.rate,
          from_date: room.from_date || editForm.check_in,
          to_date: room.to_date || editForm.check_out,
        })
      }
    }

    const currentAddonIds = addons.map((item) => item.id)
    const newAddonIds = addonList.map((item) => item.id).filter((itemId) => itemId !== null)
    const addonsToDelete = currentAddonIds.filter((itemId) => !newAddonIds.includes(itemId))
    if (addonsToDelete.length) await supabase.from('reservation_addons').delete().in('id', addonsToDelete)
    for (const addon of addonList) {
      if (addon.id) {
        await supabase.from('reservation_addons').update({ label: addon.label, price: addon.price, qty: addon.qty }).eq('id', addon.id)
      } else {
        await supabase.from('reservation_addons').insert({
          reservation_id: res.id,
          label: addon.label,
          price: addon.price,
          qty: addon.qty,
          posted: false,
        })
      }
    }

    const discountDescriptor = editForm.discount_type === 'fixed'
      ? { type: 'fixed', value: Number(editForm.discount_val) }
      : Number(editForm.discount_pct)

    const totalAmount = +roomList.reduce((sum, room) => {
      const fromDate = room.from_date || editForm.check_in
      const toDate = room.to_date || editForm.check_out
      const roomNights = nightsBetween(fromDate, toDate)
      const taxRate = rateFor(taxConfig, 'ROOM', fromDate)
      const calc = computeCharge(Number(room.rate), discountDescriptor, taxRate)
      return sum + (calc.total * roomNights)
    }, 0).toFixed(2)

    const validUntil = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const quoteSnapshot = {
      total_amount: totalAmount,
      valid_until: validUntil,
      room_rate: roomList.length > 0 ? Math.min(...roomList.map((room) => Number(room.rate))) : 0,
      room_count: roomList.length,
      discount_pct: editForm.discount_type === 'percentage' ? Number(editForm.discount_pct) : 0,
      updated_at: new Date().toISOString(),
    }

    if (quote) {
      await supabase.from('quotations').update(quoteSnapshot).eq('id', quote.id)
    } else {
      const { data: sequence } = await supabase.rpc('next_tenant_seq', { p_seq_name: 'quotation' })
      const quoteNo = `Q-${String(sequence || 1).padStart(4, '0')}`
      await supabase.from('quotations').insert({
        reservation_id: res.id,
        quote_no: quoteNo,
        ...quoteSnapshot,
        status: 'DRAFT',
        message: '',
      })
    }

    await reload()
    await loadLatestQuote()
    flash(editing ? 'Quotation updated successfully.' : 'New quotation saved.')
    setQuoteEditorOpen(false)
  }

  const buildQuoteMsg = () => {
    if (!quote) return ''
    const qr = rateFor(taxConfig, 'ROOM', res.check_in)
    const totalPreview = computeCharge((quote.room_rate || 0) * (quote.room_count || 0), quote.discount_pct || 0, qr)
    const totalValue = +(totalPreview.total * nights).toFixed(2)
    return `Dear ${guest?.full_name || 'Guest'},\n\nGreetings from ${company?.name || 'Aura Stay'}!\n\nQuotation for your stay:\n• Check-in: ${fmtDate(res.check_in)}\n• Check-out: ${fmtDate(res.check_out)} (${nights} night${nights !== 1 ? 's' : ''})\n• Rooms: ${quote.room_count} × ${fmtBDT(quote.room_rate)}/night${quote.discount_pct > 0 ? `\n• Discount: ${quote.discount_pct}%` : ''}\n• Total: ${fmtBDT(totalValue)}\n\nWarm regards,\n${company?.name || 'Aura Stay'}\n${company?.phone || ''}`
  }

  const sendQuoteWhatsApp = () => {
    const phone = (guest?.phone || '').replace(/[^0-9]/g, '')
    const intl = phone.startsWith('880') ? phone : phone.startsWith('0') ? `88${phone}` : `880${phone}`
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(buildQuoteMsg())}`, '_blank')
  }

  const sendQuoteEmail = () => window.open(
    `mailto:${guest?.email || ''}?subject=${encodeURIComponent(`Quotation — ${company?.name || 'Aura Stay'} (${res.res_no})`)}&body=${encodeURIComponent(buildQuoteMsg())}`,
    '_blank'
  )

  const printQuote = () => {
    if (!quote) return
    setPrintDoc?.({
      type: 'QUOTE',
      terms: editForm.terms_conditions || company?.terms_conditions || '',
      roomRate: quote.room_rate,
      roomCount: quote.room_count,
      discountPct: quote.discount_pct,
      validDays: 7,
      taxConfig,
      company,
      resRooms,
    })
  }

  // Render quotation card with actions
  if (quote) {
    const qr = rateFor(taxConfig, 'ROOM', res.check_in)
    const totalPreview = computeCharge((quote.room_rate || 0) * (quote.room_count || 0), quote.discount_pct || 0, qr)
    const totalValue = +(totalPreview.total * nights).toFixed(2)

    return (
      <div className="space-y-4">
        {/* Quotation Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{quote.quote_no}</h3>
              <p className="text-sm text-slate-500">Quotation for {guest?.full_name || res.reservation_name}</p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-slate-500">Total Amount</div>
              <div className="text-2xl font-bold text-slate-900">{fmtBDT(totalValue)}</div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-slate-900">Check-in</div>
              <div className="text-slate-600">{fmtDate(res.check_in)}</div>
            </div>
            <div>
              <div className="font-medium text-slate-900">Check-out</div>
              <div className="text-slate-600">{fmtDate(res.check_out)}</div>
            </div>
            <div>
              <div className="font-medium text-slate-900">Valid until</div>
              <div className="text-slate-600">{fmtDate(quote.valid_until)}</div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => printQuote()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={() => sendQuoteEmail()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Mail size={16} />
              Email
            </button>
            <button
              onClick={() => sendQuoteWhatsApp()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>
            <button
              onClick={() => openQuoteEditor(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} />
              Edit
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mb-2 text-lg font-semibold text-slate-900">No Quotation Yet</div>
      <p className="mb-4 text-sm text-slate-600">Create your first quotation for this reservation</p>
      <button
        onClick={() => openQuoteEditor(false)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Plus size={16} />
        Create Quotation
      </button>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-5 lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-pine">Quotation</h3>
          <button className="btn-ghost !py-1.5 text-xs" onClick={() => openQuoteEditor(false)}>
            <Plus size={13} /> New quotation
          </button>
        </div>
        {!quote ? (
          <p className="text-sm text-pine/50 py-4">No quotation created yet. Click "+ New quotation" to create one.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-pine/50 uppercase tracking-wide font-semibold">Quotation</div>
              <div className="font-bold text-forest money text-sm">{res.res_no}</div>
              <div className="font-semibold text-pine text-sm">{guest?.full_name || res.reservation_name || '—'}</div>
              <div className="text-xs text-pine/50">{guest?.phone || '—'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-pine/50 uppercase tracking-wide font-semibold">Stay</div>
              <div className="text-sm text-pine">{fmtDate(res.check_in)} → {fmtDate(res.check_out)}</div>
              <div className="text-xs text-pine/40">{nights} night{nights !== 1 ? 's' : ''}</div>
              <div className="text-xs text-pine/60">
                {quote.room_count ?? resRooms.length} room{(quote.room_count ?? resRooms.length) !== 1 ? 's' : ''} · {' '}
                {((res.pax_adults || 0) + (res.pax_children || 0)) || '—'} pax · {' '}
                {res.source || '—'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-pine/50 uppercase tracking-wide font-semibold">Total</div>
              <div className="font-bold text-forest money text-xl">{fmtBDT(quote.total_amount)}</div>
              <div className="text-xs text-pine/50">Valid till {fmtDate(quote.valid_until)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-pine/50 uppercase tracking-wide font-semibold">Actions</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openQuoteEditor(true)} title="Edit quotation" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-leaf text-pine/40 hover:text-forest transition-colors border border-leaf">
                  <Pencil size={13} />
                </button>
                <button onClick={printQuote} title="Print quotation" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-leaf text-pine/40 hover:text-forest transition-colors border border-leaf">
                  <Printer size={13} />
                </button>
                <button onClick={sendQuoteWhatsApp} title={guest?.phone ? 'Send via WhatsApp' : 'No phone number'} disabled={!guest?.phone} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-100 text-pine/40 hover:text-green-600 transition-colors border border-leaf disabled:opacity-25 disabled:cursor-not-allowed">
                  <MessageCircle size={13} />
                </button>
                <button onClick={sendQuoteEmail} title="Send via Email" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-pine/40 hover:text-blue-600 transition-colors border border-leaf">
                  <Mail size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {quoteEditorOpen && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-start justify-center overflow-auto p-3 sm:p-6">
          <div className="card max-w-lg w-full p-4 sm:p-6 my-3 sm:my-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-pine">{editing ? 'Edit Quotation' : 'New Quotation'}</h2>
              <button onClick={() => setQuoteEditorOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-leaf text-pine/40 hover:text-pine">✕</button>
            </div>

            <fieldset className="border border-leaf rounded-xl p-4 mb-4">
              <legend className="text-xs font-bold text-pine/60 px-2 uppercase tracking-wide">Primary Guest</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Salutation</label>
                  <SearchableSelect
                    value={editForm.salutation}
                    onChange={(value) => setEditForm({ ...editForm, salutation: value })}
                    options={['', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'].map((label) => ({ value: label, label: label || '—' }))}
                    placeholder="Select…"
                  />
                </div>
                <div><label className="label">Full Name *</label>
                  <input className="input" value={editForm.full_name} onChange={(event) => setEditForm({ ...editForm, full_name: event.target.value })} />
                </div>
                <div><label className="label">Phone (WhatsApp)</label>
                  <input className="input" placeholder="01XXXXXXXXX" value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />
                </div>
                <div><label className="label">Email</label>
                  <input className="input" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
                </div>
                <div className="col-span-1 sm:col-span-2"><label className="label">Address</label>
                  <textarea className="input" rows={2} value={editForm.address} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} />
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-leaf rounded-xl p-4 mb-4">
              <legend className="text-xs font-bold text-pine/60 px-2 uppercase tracking-wide">Stay Details</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Default Check-in *</label>
                  <input type="date" className="input" value={editForm.check_in} onChange={(event) => setEditForm({ ...editForm, check_in: event.target.value })} />
                </div>
                <div><label className="label">Default Check-out *</label>
                  <input type="date" className="input" value={editForm.check_out} onChange={(event) => setEditForm({ ...editForm, check_out: event.target.value })} />
                </div>
                <div><label className="label">Adults</label>
                  <input type="number" min="1" className="input" value={editForm.pax_adults} onChange={(event) => setEditForm({ ...editForm, pax_adults: event.target.value })} />
                </div>
                <div><label className="label">Children</label>
                  <input type="number" min="0" className="input" value={editForm.pax_children} onChange={(event) => setEditForm({ ...editForm, pax_children: event.target.value })} />
                </div>
                <div><label className="label">Guest Type</label>
                  <div className="flex gap-2">
                    {['Individual', 'Company'].map((type) => (
                      <button key={type} type="button" className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${editForm.guest_type === type ? 'bg-forest text-white border-forest' : 'border-leaf text-pine hover:border-forest'}`} onClick={() => setEditForm({ ...editForm, guest_type: type })}>{type}</button>
                    ))}
                  </div>
                </div>
                <div><label className="label">Source</label>
                  <SearchableSelect
                    value={editForm.source}
                    onChange={(value) => setEditForm({ ...editForm, source: value })}
                    options={['Phone', 'Walk-in', 'Email', 'Website', 'OTA', 'Agent', 'Corporate', 'Other']}
                    placeholder="Select source…"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2"><label className="label">Reservation Name</label>
                  <input className="input" value={editForm.reservation_name} onChange={(event) => setEditForm({ ...editForm, reservation_name: event.target.value })} />
                  <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" id="useResName" checked={editForm.use_reservation_name_only} onChange={(event) => setEditForm({ ...editForm, use_reservation_name_only: event.target.checked })} />
                    <label htmlFor="useResName" className="text-xs text-pine/60">Same as Reservation Name</label>
                  </div>
                </div>
                <div className="col-span-1 sm:col-span-2"><label className="label">Notes / Special Requests</label>
                  <textarea className="input" rows={2} value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} />
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-leaf rounded-xl p-4 mb-4">
              <legend className="text-xs font-bold text-pine/60 px-2 uppercase tracking-wide">Rooms — Pick from dropdown, each with its own dates</legend>
              <div className="flex gap-2 mb-3">
                <SearchableSelect
                  className="flex-1"
                  value=""
                  onChange={(roomId) => {
                    const room = roomsAll.find((item) => item.id === roomId)
                    if (room) assignRoomInModal(room)
                  }}
                  options={roomsAll
                    .filter((room) => !roomList.some((row) => row.room_id === room.id))
                    .map((room) => ({ value: room.id, label: `${room.room_no}${room.room_name ? ` - ${room.room_name}` : ''} (${room.room_type})` }))}
                  placeholder="+ Add room"
                />
              </div>
              {roomList.length === 0 && <p className="text-xs text-pine/50">No rooms added yet — click "+ Add room".</p>}
              {roomList.map((room, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-leaf/30 py-2">
                  <span className="text-sm font-semibold flex-1">{room.room_no}{room.room_name ? ` · ${room.room_name}` : ''}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="date" className="input !py-1 !w-36" value={room.from_date || editForm.check_in} onChange={(event) => setRoomList((prev) => prev.map((item, i) => (i === idx ? { ...item, from_date: event.target.value } : item)))} />
                    <input type="date" className="input !py-1 !w-36" value={room.to_date || editForm.check_out} onChange={(event) => setRoomList((prev) => prev.map((item, i) => (i === idx ? { ...item, to_date: event.target.value } : item)))} />
                    <input type="number" className="input !w-20 !py-1 money" value={room.rate} onChange={(event) => updateRoomRateInModal(idx, event.target.value)} />
                    <button onClick={() => removeRoomInModal(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </fieldset>

            <fieldset className="border border-leaf rounded-xl p-4 mb-4">
              <legend className="text-xs font-bold text-pine/60 px-2 uppercase tracking-wide">Including Items</legend>
              <p className="text-xs text-pine/50 mb-3">Select any items included with this booking. Prices entered here are saved against the reservation but only posted to the bill when you choose to.</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <input className="input flex-1 min-w-[120px]" placeholder="Item label" value={newAddon.label} onChange={(event) => setNewAddon({ ...newAddon, label: event.target.value })} />
                <input type="number" className="input !w-24" placeholder="Price" value={newAddon.price} onChange={(event) => setNewAddon({ ...newAddon, price: event.target.value })} />
                <input type="number" className="input !w-16" placeholder="Qty" min="1" value={newAddon.qty} onChange={(event) => setNewAddon({ ...newAddon, qty: event.target.value })} />
                <button className="btn-ghost !py-1" onClick={addAddonItem}><Plus size={14} /></button>
              </div>
              {addonList.length === 0 && <p className="text-xs text-pine/40 py-1">No items added.</p>}
              {addonList.map((addon, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-leaf/20 py-1.5">
                  <span className="text-sm">{addon.label} × {addon.qty}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm money text-pine/70">{fmtBDT(Number(addon.price) * Number(addon.qty))}</span>
                    <button onClick={() => removeAddonItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </fieldset>

            <fieldset className="border border-leaf rounded-xl p-4 mb-4">
              <legend className="text-xs font-bold text-pine/60 px-2 uppercase tracking-wide">Discount</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${editForm.discount_type === 'percentage' ? 'bg-forest text-white border-forest' : 'border-leaf text-pine'}`} onClick={() => setEditForm({ ...editForm, discount_type: 'percentage' })}>%</button>
                <button type="button" className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${editForm.discount_type === 'fixed' ? 'bg-forest text-white border-forest' : 'border-leaf text-pine'}`} onClick={() => setEditForm({ ...editForm, discount_type: 'fixed' })}>৳ Fixed</button>
                {editForm.discount_type === 'percentage' ? (
                  <input type="number" min="0" max="100" className="input money flex-1 min-w-[100px]" value={editForm.discount_pct} onChange={(event) => setEditForm({ ...editForm, discount_pct: event.target.value })} />
                ) : (
                  <input type="number" min="0" className="input money flex-1 min-w-[100px]" value={editForm.discount_val} onChange={(event) => setEditForm({ ...editForm, discount_val: event.target.value })} />
                )}
              </div>
            </fieldset>

            <fieldset className="border border-leaf rounded-xl p-4 mb-5">
              <legend className="text-xs font-bold text-pine/60 px-2 uppercase tracking-wide">Terms & Conditions</legend>
              {(editForm.terms_conditions || company?.terms_conditions) ? (
                <div className="text-sm text-pine/70 bg-leaf/20 rounded-lg p-3 min-h-[72px] max-h-48 overflow-y-auto">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{editForm.terms_conditions || company?.terms_conditions}</div>
                </div>
              ) : (
                <p className="text-sm text-pine/40 italic py-3">No terms configured. Go to Settings → Company to add default terms.</p>
              )}
            </fieldset>

            <div className="flex flex-wrap gap-3 justify-end border-t border-leaf pt-4">
              <button className="btn-ghost" onClick={() => setQuoteEditorOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateQuotation}>
                <Save size={16} /> {editing ? 'Update Quotation' : 'Save Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {quote && setPrintDoc && false && (
        <Quotation
          res={res}
          guest={guest}
          terms={editForm.terms_conditions || company?.terms_conditions || ''}
          roomRate={quote.room_rate}
          roomCount={quote.room_count}
          discountPct={quote.discount_pct}
          validDays={7}
          taxConfig={taxConfig}
          company={company}
          resRooms={resRooms}
        />
      )}
    </div>
  )
}
