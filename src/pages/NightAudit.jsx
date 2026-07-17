import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { fmtBDT, fmtDate, todayISO, rateFor, computeCharge, exportXLSX } from '../lib/helpers'
import KPICards from '../components/KPICards.jsx'
import PrintPortal from '../components/PrintPortal.jsx'
import { MoonStar, BedDouble, UserX, CheckCircle2, FileDown, BookOpenCheck, Printer, XCircle } from 'lucide-react'
import { logAudit } from '../lib/pms.api.js'
import { getCompanySettingsQuery, getPrintBrandProps, withTenantScope } from '../lib/companySettings'
import { withTenantInsert, withTenantInsertMany } from '../lib/tenant'

// CASH_ACC/REV_ACC removed — revenue account routing now lives entirely in
// trg_folio_charge_revenue (per-charge, at posting time), not here.

export default function NightAudit({ userName, isAdmin, role }) {
  const canCloseDay = isAdmin || role === 'SUPERUSER'
  const canOpenDay = role === 'SUPERUSER'
  const [auditDate, setAuditDate] = useState(todayISO())
  const [inHouse, setInHouse] = useState([])
  const [noShows, setNoShows] = useState([])
  const [postedToday, setPostedToday] = useState([])
  const [taxConfig, setTaxConfig] = useState([])
  const [summary, setSummary] = useState(null)
  const [audits, setAudits] = useState([])
  const [existing, setExisting] = useState(null)
  const [closeMarks, setCloseMarks] = useState([])
  const [company, setCompany] = useState(null)
  const [printAudit, setPrintAudit] = useState(null)
  // Revenue is now recognised automatically the moment each night's room
  // charge is posted (folio_charges → trg_folio_charge_revenue), so Night
  // Audit no longer needs to build its own separate summary journal voucher
  // — doing so would double-count the same revenue. makeJV / jvId removed.
  const [busy, setBusy] = useState(false)
  const [rangeFrom, setRangeFrom] = useState(todayISO())
  const [rangeTo, setRangeTo] = useState(todayISO())
  const [rangeBusy, setRangeBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 6000) }

  useEffect(() => { getCompanySettingsQuery('*').limit(1).maybeSingle().then(({ data }) => setCompany(data)) }, [])

  const loadAll = async () => {
    const [ih, ns, fc, tc, na, ex, dc] = await Promise.all([
      withTenantScope(supabase.from('reservations').select('*, reservation_rooms(*, rooms(*))').eq('status', 'CHECKED_IN')),
      withTenantScope(supabase.from('reservations').select('*, guests:primary_guest_id(full_name)').eq('status', 'CONFIRMED').lt('check_in', auditDate)),
      withTenantScope(supabase.from('folio_charges').select('reservation_id, charge_type').eq('charge_date', auditDate).eq('charge_type', 'ROOM')),
      withTenantScope(supabase.from('tax_config').select('*')),
      withTenantScope(supabase.from('night_audits').select('*')).order('audit_date', { ascending: false }).limit(15),
      withTenantScope(supabase.from('night_audits').select('*').eq('audit_date', auditDate)).maybeSingle(),
      withTenantScope(supabase.from('day_closes').select('*').eq('close_date', auditDate)).in('type', ['RESERVATION', 'RESTAURANT']),
    ])
    const inHouseRows = ih.data || []
    const auditRows = na.data || []

    // A closed day is considered "Posted" once the day-close action itself
    // has completed — even a zero-activity day (no guests, no charges, no
    // journal) still counts, since there's nothing outstanding to post for
    // that date. night_audits row presence == day was closed == Posted.
    const auditsWithJv = auditRows.map((a) => ({ ...a, jv_status: 'POSTED' }))

    setInHouse(inHouseRows); setNoShows(ns.data || []); setPostedToday(fc.data || [])
    setTaxConfig(tc.data || []); setAudits(auditsWithJv); setExisting(ex.data || null)
    setCloseMarks(dc.data || [])
    await buildSummary(inHouseRows)
  }

  const buildSummary = async (inHouseRows = inHouse) => {
    const inHouseIds = (inHouseRows || []).map((r) => r.id)
    const [fc, pay, posWalk, facWalk, invAll, folioAll, payAll] = await Promise.all([
      withTenantScope(supabase.from('folio_charges').select('*').eq('charge_date', auditDate)),
      withTenantScope(supabase.from('payments').select('*').eq('received_date', auditDate)),
      withTenantScope(supabase.from('pos_orders').select('*').eq('status', 'SETTLED').is('reservation_id', null))
        .gte('settled_at', auditDate + 'T00:00:00').lte('settled_at', auditDate + 'T23:59:59'),
      withTenantScope(supabase.from('facility_sales').select('*').eq('status', 'SETTLED').is('reservation_id', null).eq('sale_date', auditDate)),
      inHouseIds.length > 0
        ? withTenantScope(supabase.from('invoices').select('id,reservation_id,invoice_no,issued_at,totals,due,paid,status,is_void').in('reservation_id', inHouseIds).eq('is_void', false)).order('issued_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      inHouseIds.length > 0
        ? withTenantScope(supabase.from('folio_charges').select('reservation_id,total').in('reservation_id', inHouseIds))
        : Promise.resolve({ data: [] }),
      inHouseIds.length > 0
        ? withTenantScope(supabase.from('payments').select('reservation_id,amount').in('reservation_id', inHouseIds))
        : Promise.resolve({ data: [] }),
    ])
    const revenue = {}
    const add = (type, net, sc, vat, total) => {
      const r = revenue[type] || { net: 0, sc: 0, vat: 0, total: 0 }
      r.net += net; r.sc += sc; r.vat += vat; r.total += total
      revenue[type] = r
    }
    for (const c of fc.data || []) add(c.charge_type, +c.base_amount - +c.discount, +c.service_charge, +c.vat, +c.total)
    for (const o of posWalk.data || []) add('RESTAURANT', +o.base_amount - +o.discount, +o.service_charge, +o.vat, +o.total)
    for (const f of facWalk.data || []) add(f.item_name?.toUpperCase().includes('TEA') ? 'TEA' : 'OTHER FACILITY', +f.base_amount - +f.discount, +f.service_charge, +f.vat, +f.total)

    const receipts = {}
    for (const p of pay.data || []) receipts[p.method] = (receipts[p.method] || 0) + +p.amount
    for (const o of posWalk.data || []) receipts[o.payment_method || 'CASH'] = (receipts[o.payment_method || 'CASH'] || 0) + +o.total
    for (const f of facWalk.data || []) receipts[f.payment_method || 'CASH'] = (receipts[f.payment_method || 'CASH'] || 0) + +f.total

    const tot = Object.values(revenue).reduce((a, r) => ({ net: a.net + r.net, sc: a.sc + r.sc, vat: a.vat + r.vat, total: a.total + r.total }), { net: 0, sc: 0, vat: 0, total: 0 })
    const recTotal = Object.values(receipts).reduce((a, v) => a + v, 0)

    const activeInvoiceByRes = {}
    for (const inv of invAll.data || []) {
      if (!activeInvoiceByRes[inv.reservation_id]) activeInvoiceByRes[inv.reservation_id] = inv
    }
    const folioByRes = {}
    for (const c of folioAll.data || []) {
      folioByRes[c.reservation_id] = (folioByRes[c.reservation_id] || 0) + Number(c.total || 0)
    }
    const paidByRes = {}
    for (const p of payAll.data || []) {
      paidByRes[p.reservation_id] = (paidByRes[p.reservation_id] || 0) + Number(p.amount || 0)
    }
    const postedSet = new Set((fc.data || []).filter((c) => c.charge_type === 'ROOM').map((c) => c.reservation_id))
    const invoiceRows = (inHouseRows || []).map((r) => {
      const inv = activeInvoiceByRes[r.id]
      const folioTotal = folioByRes[r.id] || 0
      const paidTotal = paidByRes[r.id] || 0
      const invoiceTotal = Number(inv?.totals?.grand_total ?? folioTotal)
      const dueAmount = Number(inv?.due ?? (invoiceTotal - paidTotal))
      const roomList = (r.reservation_rooms || []).map((x) => x.rooms?.room_no).filter(Boolean).join(', ')
      return {
        reservation_id: r.id,
        res_no: r.res_no,
        guest: r.reservation_name || r.guests?.full_name || '—',
        rooms: roomList || '—',
        invoice_no: inv?.invoice_no || 'Not issued',
        invoice_total: invoiceTotal,
        paid: Number(inv?.paid ?? paidTotal),
        due: dueAmount,
        invoice_status: inv?.status || 'PENDING_INVOICE',
        room_posted_today: postedSet.has(r.id),
      }
    })
    const invoiceTotals = invoiceRows.reduce((a, r) => ({
      invoice_total: a.invoice_total + r.invoice_total,
      paid: a.paid + r.paid,
      due: a.due + r.due,
    }), { invoice_total: 0, paid: 0, due: 0 })

    setSummary({ revenue, totals: tot, receipts, recTotal, inHouseCount: (inHouseRows || []).length, invoiceRows, invoiceTotals })
  }

  useEffect(() => { loadAll() }, [auditDate]) // eslint-disable-line

  const buildRoomChargeRows = () => {
    const postedSet = new Set(postedToday.map((p) => p.reservation_id))
    const rows = []
    for (const res of inHouse) {
      if (postedSet.has(res.id)) continue
      const rate = rateFor(taxConfig, 'ROOM', auditDate)
      for (const rr of res.reservation_rooms || []) {
        const ci = rr.from_date || res.check_in
        const co = rr.to_date || res.check_out
        if (auditDate < ci || auditDate >= co) continue
        rows.push({ reservation_id: res.id, charge_date: auditDate, charge_type: 'ROOM', description: `Room ${rr.rooms?.room_no}${rr.rooms?.room_name ? ` (${rr.rooms.room_name})` : ''} — Night of ${fmtDate(auditDate)} (night audit)`, ...computeCharge(rr.rate, res.discount_pct, rate), created_by: userName })
      }
      if (auditDate >= res.check_in && auditDate < res.check_out) {
        if (res.extra_pax > 0 && res.extra_pax_rate > 0)
          rows.push({ reservation_id: res.id, charge_date: auditDate, charge_type: 'ROOM', description: `Extra pax × ${res.extra_pax} — ${fmtDate(auditDate)} (night audit)`, ...computeCharge(res.extra_pax * res.extra_pax_rate, res.discount_pct, rate), created_by: userName })
        if (res.driver_accommodation && res.driver_count > 0 && res.driver_rate > 0)
          rows.push({ reservation_id: res.id, charge_date: auditDate, charge_type: 'ROOM', description: `Driver accommodation × ${res.driver_count} — ${fmtDate(auditDate)} (night audit)`, ...computeCharge(res.driver_count * res.driver_rate, res.discount_pct, rate), created_by: userName })
      }
    }
    return rows
  }

  const postRoomCharges = async () => {
    setBusy(true)
    const rows = buildRoomChargeRows()
    if (rows.length === 0) { setBusy(false); flash('Nothing to post — every in-house room already has tonight\'s charge.'); return }
    const { error } = await supabase.from('folio_charges').insert(withTenantInsertMany(rows))
    setBusy(false)
    if (error) flash(error.message)
    else { flash(`${rows.length} room charge line(s) posted for ${fmtDate(auditDate)}.`); await loadAll() }
  }

  const markNoShow = async (res) => {
    if (!window.confirm(`Mark ${res.res_no} (${res.reservation_name || res.guests?.full_name || ''}) as NO-SHOW?`)) return
    await withTenantScope(supabase.from('reservations').update({ status: 'NO_SHOW' }).eq('id', res.id))
    await logAudit({ actor: userName, action: 'NO_SHOW', entity: 'reservation', entity_id: res.res_no, details: { audit_date: auditDate, source: 'MANUAL' } })
    await loadAll()
  }

  const closeDay = async () => {
    if (!canCloseDay) { flash('Only Admin or SUPERUSER can close the day.'); return }
    if (!summary) return
    setBusy(true)
    try {
      // Auto-post tonight's room charges first — this is what actually
      // triggers the revenue journal (trg_folio_charge_revenue fires on
      // the folio_charges insert). Closing the day now guarantees the
      // journal is posted, without a separate manual "Post room charges"
      // click.
      let postedCount = 0
      const rows = buildRoomChargeRows()
      if (rows.length > 0) {
        const { error: chargeErr } = await supabase.from('folio_charges').insert(withTenantInsertMany(rows))
        if (chargeErr) throw chargeErr
        postedCount = rows.length
      }

      const payload = withTenantInsert({ audit_date: auditDate, performed_by: userName, performed_at: new Date().toISOString(), summary, jv_id: null, notes: 'Revenue posted automatically per charge.' })
      const { error } = await supabase.from('night_audits').upsert(payload, { onConflict: 'tenant_id,audit_date' })
      if (error) throw error

      const dayStart = `${auditDate}T00:00:00+06:00`
      const dayEnd = `${auditDate}T23:59:59+06:00`
      const [{ data: rest }, { data: resv }] = await Promise.all([
        withTenantScope(supabase.from('pos_orders').select('total,status').is('reservation_id', null).gte('created_at', dayStart).lte('created_at', dayEnd)),
        withTenantScope(supabase.from('pos_orders').select('total,status').not('reservation_id', 'is', null).gte('created_at', dayStart).lte('created_at', dayEnd)),
      ])
      const restSettled = (rest || []).filter((o) => o.status === 'SETTLED')
      const resCharged = (resv || []).filter((o) => o.status === 'CHARGED_TO_ROOM')
      await withTenantScope(supabase.from('day_closes').delete().eq('close_date', auditDate)).in('type', ['RESERVATION', 'RESTAURANT'])
      const { error: dcErr } = await supabase.from('day_closes').insert(withTenantInsertMany([
        {
          close_date: auditDate,
          closed_by: userName,
          closed_at: new Date().toISOString(),
          type: 'RESTAURANT',
          settled_amount: restSettled.reduce((a, o) => a + Number(o.total || 0), 0),
          settled_orders: restSettled.length,
        },
        {
          close_date: auditDate,
          closed_by: userName,
          closed_at: new Date().toISOString(),
          type: 'RESERVATION',
          charged_amount: resCharged.reduce((a, o) => a + Number(o.total || 0), 0),
          charged_orders: resCharged.length,
        },
      ]))
      if (dcErr) throw dcErr

      await withTenantScope(supabase.from('company_settings').update({ last_audit_date: auditDate })).gt('id', 0)
      flash(`Night audit for ${fmtDate(auditDate)} ${existing ? 'updated' : 'closed'}.${postedCount > 0 ? ` ${postedCount} room charge(s) posted — journal auto-posted.` : ''}`)
      await loadAll()
    } catch (e) { flash(e.message) }
    setBusy(false)
  }

  // Close a whole span of nights in one action. Walks the range
  // chronologically (oldest night first) so that even a back-dated range
  // posts each night's room charge — and therefore each night's JV, via
  // trg_folio_charge_revenue — with jv_date carried from that charge's own
  // charge_date. That keeps the accounting ledger in correct date order
  // regardless of when the button is actually clicked.
  const closeDateRange = async () => {
    if (!canCloseDay) { flash('Only Admin or SUPERUSER can close the day.'); return }
    if (!rangeFrom || !rangeTo || rangeFrom > rangeTo) { flash('Pick a valid From/To range (From must be on or before To).'); return }
    setRangeBusy(true)
    let totalCharges = 0
    let daysProcessed = 0
    try {
      // Broad fetch: any reservation whose stay could overlap this range,
      // regardless of CURRENT status — a back-dated range often includes
      // guests who have since checked out, so we can't filter to
      // status = 'CHECKED_IN' the way the single-day view does.
      const { data: candidateRes } = await withTenantScope(
        supabase.from('reservations')
          .select('*, reservation_rooms(*, rooms(*))')
          .lt('check_in', rangeTo)
          .gt('check_out', rangeFrom)
      )
      const reservations = candidateRes || []

      const { data: existingCharges } = await withTenantScope(
        supabase.from('folio_charges').select('reservation_id, charge_date').eq('charge_type', 'ROOM').gte('charge_date', rangeFrom).lte('charge_date', rangeTo)
      )
      const postedSet = new Set((existingCharges || []).map((c) => `${c.reservation_id}|${c.charge_date}`))

      let d = new Date(rangeFrom + 'T00:00:00')
      const end = new Date(rangeTo + 'T00:00:00')
      while (d <= end) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const rate = rateFor(taxConfig, 'ROOM', dateStr)
        const rows = []
        for (const res of reservations) {
          for (const rr of res.reservation_rooms || []) {
            const ci = rr.from_date || res.check_in
            const co = rr.to_date || res.check_out
            if (dateStr < ci || dateStr >= co) continue
            const key = `${res.id}|${dateStr}`
            if (postedSet.has(key)) continue
            rows.push({ reservation_id: res.id, charge_date: dateStr, charge_type: 'ROOM', description: `Room ${rr.rooms?.room_no}${rr.rooms?.room_name ? ` (${rr.rooms.room_name})` : ''} — Night of ${fmtDate(dateStr)} (range close)`, ...computeCharge(rr.rate, res.discount_pct, rate), created_by: userName })
          }
          if (dateStr >= res.check_in && dateStr < res.check_out) {
            const key = `${res.id}|${dateStr}`
            if (!postedSet.has(key)) {
              if (res.extra_pax > 0 && res.extra_pax_rate > 0)
                rows.push({ reservation_id: res.id, charge_date: dateStr, charge_type: 'ROOM', description: `Extra pax × ${res.extra_pax} — ${fmtDate(dateStr)} (range close)`, ...computeCharge(res.extra_pax * res.extra_pax_rate, res.discount_pct, rate), created_by: userName })
              if (res.driver_accommodation && res.driver_count > 0 && res.driver_rate > 0)
                rows.push({ reservation_id: res.id, charge_date: dateStr, charge_type: 'ROOM', description: `Driver accommodation × ${res.driver_count} — ${fmtDate(dateStr)} (range close)`, ...computeCharge(res.driver_count * res.driver_rate, res.discount_pct, rate), created_by: userName })
            }
          }
        }

        if (rows.length > 0) {
          const { error: chargeErr } = await supabase.from('folio_charges').insert(withTenantInsertMany(rows))
          if (chargeErr) throw chargeErr
          totalCharges += rows.length
          rows.forEach((r) => postedSet.add(`${r.reservation_id}|${r.charge_date}`))
        }

        const payload = withTenantInsert({ audit_date: dateStr, performed_by: userName, performed_at: new Date().toISOString(), summary: null, jv_id: null, notes: 'Range close — revenue posted automatically per charge.' })
        await supabase.from('night_audits').upsert(payload, { onConflict: 'tenant_id,audit_date' })

        const dayStart = `${dateStr}T00:00:00+06:00`
        const dayEnd = `${dateStr}T23:59:59+06:00`
        const [{ data: rest }, { data: resv }] = await Promise.all([
          withTenantScope(supabase.from('pos_orders').select('total,status').is('reservation_id', null).gte('created_at', dayStart).lte('created_at', dayEnd)),
          withTenantScope(supabase.from('pos_orders').select('total,status').not('reservation_id', 'is', null).gte('created_at', dayStart).lte('created_at', dayEnd)),
        ])
        const restSettled = (rest || []).filter((o) => o.status === 'SETTLED')
        const resCharged = (resv || []).filter((o) => o.status === 'CHARGED_TO_ROOM')
        await withTenantScope(supabase.from('day_closes').delete().eq('close_date', dateStr)).in('type', ['RESERVATION', 'RESTAURANT'])
        await supabase.from('day_closes').insert(withTenantInsertMany([
          { close_date: dateStr, closed_by: userName, closed_at: new Date().toISOString(), type: 'RESTAURANT', settled_amount: restSettled.reduce((a, o) => a + Number(o.total || 0), 0), settled_orders: restSettled.length },
          { close_date: dateStr, closed_by: userName, closed_at: new Date().toISOString(), type: 'RESERVATION', charged_amount: resCharged.reduce((a, o) => a + Number(o.total || 0), 0), charged_orders: resCharged.length },
        ]))

        daysProcessed += 1
        d = new Date(d.getTime() + 86400000)
      }

      await withTenantScope(supabase.from('company_settings').update({ last_audit_date: rangeTo })).gt('id', 0)
      flash(`Closed ${daysProcessed} day(s), ${fmtDate(rangeFrom)} → ${fmtDate(rangeTo)}. ${totalCharges} room charge(s) posted — journals auto-posted in date order.`)
      await loadAll()
    } catch (e) {
      flash(e.message)
    }
    setRangeBusy(false)
  }

  const openDay = async () => {
    if (!canOpenDay) { flash('Only SUPERUSER can open a closed day.'); return }
    setBusy(true)
    const { error } = await withTenantScope(supabase.from('day_closes').delete().eq('close_date', auditDate)).in('type', ['RESERVATION', 'RESTAURANT'])
    setBusy(false)
    if (error) flash(error.message)
    else { flash(`Day opened for ${fmtDate(auditDate)} — Reservation and Restaurant.`); await loadAll() }
  }

  const exportSummary = () => {
    if (!summary) return
    const rows = [
      [`Night Audit — ${fmtDate(auditDate)}`], [`Performed by: ${userName}`], [],
      ['REVENUE (accrual)'], ['Type', 'Net', 'Service Charge', 'VAT', 'Total'],
      ...Object.entries(summary.revenue).map(([t, r]) => [t, r.net, r.sc, r.vat, r.total]),
      ['TOTAL', summary.totals.net, summary.totals.sc, summary.totals.vat, summary.totals.total], [],
      ['RECEIPTS (cash basis)'], ['Method', 'Amount'],
      ...Object.entries(summary.receipts).map(([m, v]) => [m, v]),
      ['TOTAL', summary.recTotal],
      [],
      ['INVOICE-WISE SNAPSHOT'], ['Res No', 'Guest', 'Rooms', 'Invoice', 'Invoice Total', 'Paid', 'Due', 'Room Posted Today'],
      ...(summary.invoiceRows || []).map((r) => [r.res_no, r.guest, r.rooms, r.invoice_no, r.invoice_total, r.paid, r.due, r.room_posted_today ? 'Yes' : 'No']),
    ]
    exportXLSX(`Night_Audit_${auditDate}.xlsx`, [{ name: 'Night Audit', rows }])
  }

  const unposted = inHouse.filter((r) => !postedToday.some((p) => p.reservation_id === r.id) && auditDate >= r.check_in && auditDate < r.check_out)

  return (
    <div className="space-y-5">
      {printAudit && (
        <PrintPortal title={`Night Audit — ${printAudit.audit_date}`} onClose={() => setPrintAudit(null)} {...getPrintBrandProps(company)}>
          <NightAuditReport audit={printAudit} company={company} />
        </PrintPortal>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-pine flex items-center gap-2"><MoonStar className="text-forest" /> Night Audit</h1>
          <p className="text-sm text-pine/60">End-of-day routine: post room charges, clear no-shows, balance the day and print the report.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="label !mb-0">Audit date</span>
          <input type="date" className="input !w-44" value={auditDate} onChange={(e) => setAuditDate(e.target.value)} />
        </div>
      </div>
      <KPICards module="nightaudit" />
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      {existing && <div className="px-4 py-3 rounded-lg bg-amber/10 text-amber text-sm font-medium">This date was already audited by {existing.performed_by} on {fmtDate(existing.performed_at)}. Closing again will overwrite the saved summary.</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-pine flex items-center gap-2 mb-2"><BedDouble size={17} className="text-forest" /> 1 · Post tonight's room charges</h3>
          <p className="text-sm text-pine/60 mb-3">{inHouse.length} guest(s) in house · {unposted.length} still without a charge for {fmtDate(auditDate)}.</p>
          {unposted.length > 0 && (
            <ul className="text-sm mb-3 space-y-1">
              {unposted.map((r) => <li key={r.id} className="flex justify-between"><span>{r.res_no} — {r.reservation_name}</span><span className="text-pine/50">{(r.reservation_rooms || []).map((x) => x.rooms?.room_no).join(', ')}</span></li>)}
            </ul>
          )}
          <button className="btn-primary" disabled={busy || unposted.length === 0} onClick={postRoomCharges}><CheckCircle2 size={15} /> Post room charges ({unposted.length})</button>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-pine flex items-center gap-2 mb-2"><UserX size={17} className="text-amber" /> 2 · No-shows</h3>
          <p className="text-sm text-pine/60 mb-3">Confirmed bookings whose check-in date has passed without arrival.</p>
          {noShows.length === 0 ? <p className="text-sm text-pine/40">None — clean slate.</p> : (
            <ul className="text-sm space-y-2">
              {noShows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span>{r.res_no} — {r.reservation_name || r.guests?.full_name} <span className="text-pine/40">(in {fmtDate(r.check_in)})</span></span>
                  <button className="btn-ghost !py-1 text-red-600" onClick={() => markNoShow(r)}>Mark no-show</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {summary && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display font-semibold text-pine flex items-center gap-2"><BookOpenCheck size={17} className="text-forest" /> 3 · Day summary & close</h3>
            <button className="btn-ghost !py-1.5" onClick={exportSummary}><FileDown size={14} /> Excel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="label">Revenue posted today (accrual)</div>
              <table className="w-full">
                <thead><tr><th className="th">Type</th><th className="th text-right">Net</th><th className="th text-right">SC</th><th className="th text-right">VAT</th><th className="th text-right">Total</th></tr></thead>
                <tbody>
                  {Object.entries(summary.revenue).map(([t, r]) => (
                    <tr key={t}><td className="td">{t}</td><td className="td money text-right">{r.net.toFixed(2)}</td><td className="td money text-right">{r.sc.toFixed(2)}</td><td className="td money text-right">{r.vat.toFixed(2)}</td><td className="td money text-right font-semibold">{r.total.toFixed(2)}</td></tr>
                  ))}
                  {Object.keys(summary.revenue).length === 0 && <tr><td className="td text-pine/40" colSpan={5}>No charges posted on this date.</td></tr>}
                </tbody>
                <tfoot><tr className="bg-leaf/40 font-bold money"><td className="td">TOTAL</td><td className="td text-right">{summary.totals.net.toFixed(2)}</td><td className="td text-right">{summary.totals.sc.toFixed(2)}</td><td className="td text-right">{summary.totals.vat.toFixed(2)}</td><td className="td text-right">{summary.totals.total.toFixed(2)}</td></tr></tfoot>
              </table>
            </div>
            <div>
              <div className="label">Receipts today (cash basis)</div>
              <table className="w-full">
                <thead><tr><th className="th">Method</th><th className="th text-right">Amount</th></tr></thead>
                <tbody>
                  {Object.entries(summary.receipts).map(([m, v]) => <tr key={m}><td className="td">{m}</td><td className="td money text-right">{fmtBDT(v)}</td></tr>)}
                  {Object.keys(summary.receipts).length === 0 && <tr><td className="td text-pine/40" colSpan={2}>No receipts on this date.</td></tr>}
                </tbody>
                <tfoot><tr className="bg-leaf/40 font-bold money"><td className="td">TOTAL</td><td className="td text-right">{fmtBDT(summary.recTotal)}</td></tr></tfoot>
              </table>
              <p className="flex items-start gap-2 text-xs text-pine/60 mt-4">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                Revenue is posted automatically to Accounting the moment each night's room charge is created — no manual journal voucher step needed here.
              </p>
              {canCloseDay ? (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button className="btn-primary" disabled={busy} onClick={closeDay}><MoonStar size={15} /> {existing ? 'Re-close day' : 'Close the day'}</button>
                  {canOpenDay && closeMarks.length > 0 && (
                    <button className="btn-ghost text-red-600" disabled={busy} onClick={openDay}><XCircle size={15} /> Day Open</button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-pine/50 mt-3">Day-close requires Admin or SUPERUSER access.</p>
              )}
            </div>
          </div>
          {canCloseDay && (
            <div className="card p-4">
              <h3 className="font-display font-semibold text-pine flex items-center gap-2 mb-2"><BookOpenCheck size={17} className="text-forest" /> Close a date range</h3>
              <p className="text-xs text-pine/60 mb-3">
                Catch up several nights at once — each date is closed in order (oldest first), so a back-dated range still posts every night's room charge and journal voucher under its own correct date.
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="label !text-xs">From</label>
                  <input type="date" className="input" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
                </div>
                <div>
                  <label className="label !text-xs">To</label>
                  <input type="date" className="input" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
                </div>
                <button className="btn-amber" disabled={rangeBusy} onClick={closeDateRange}>
                  <MoonStar size={15} /> {rangeBusy ? 'Closing…' : 'Close date range'}
                </button>
              </div>
            </div>
          )}
          <div>
            <div className="label">Invoice-wise audit snapshot (in-house guests)</div>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">Res No</th>
                    <th className="th">Guest</th>
                    <th className="th">Rooms</th>
                    <th className="th">Invoice</th>
                    <th className="th text-right">Invoice Total</th>
                    <th className="th text-right">Paid</th>
                    <th className="th text-right">Due</th>
                    <th className="th">Room Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary.invoiceRows || []).map((r) => (
                    <tr key={r.reservation_id}>
                      <td className="td money text-xs">{r.res_no}</td>
                      <td className="td text-sm">{r.guest}</td>
                      <td className="td text-xs">{r.rooms}</td>
                      <td className="td text-xs money">{r.invoice_no}</td>
                      <td className="td money text-right">{fmtBDT(r.invoice_total)}</td>
                      <td className="td money text-right">{fmtBDT(r.paid)}</td>
                      <td className="td money text-right font-semibold">{fmtBDT(r.due)}</td>
                      <td className="td text-xs">
                        <span className={`status-chip ${r.room_posted_today ? 'bg-forest/15 text-forest' : 'bg-amber/20 text-amber'}`}>
                          {r.room_posted_today ? 'Yes' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(summary.invoiceRows || []).length === 0 && (
                    <tr><td className="td text-pine/40" colSpan={8}>No in-house reservations on this audit date.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-leaf/40 font-bold money">
                    <td className="td" colSpan={4}>TOTAL</td>
                    <td className="td text-right">{fmtBDT(summary.invoiceTotals?.invoice_total)}</td>
                    <td className="td text-right">{fmtBDT(summary.invoiceTotals?.paid)}</td>
                    <td className="td text-right">{fmtBDT(summary.invoiceTotals?.due)}</td>
                    <td className="td"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 pt-4 pb-2 font-display font-semibold text-pine">Recent audits</div>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr><th className="th">Date</th><th className="th">By</th><th className="th text-right">Revenue total</th><th className="th text-right">Receipts</th><th className="th">JV</th><th className="th text-right">Report</th></tr></thead>
          <tbody>
            {audits.map((a) => (
              <tr key={a.id}>
                <td className="td money">{fmtDate(a.audit_date)}</td>
                <td className="td text-sm">{a.performed_by}</td>
                <td className="td money text-right">{fmtBDT(a.summary?.totals?.total)}</td>
                <td className="td money text-right">{fmtBDT(a.summary?.recTotal)}</td>
                <td className="td text-xs">{a.jv_status === 'POSTED' ? 'Posted' : a.jv_status === 'PARTIAL' ? 'Partial' : '—'}</td>
                <td className="td text-right"><button className="btn-ghost !py-1" onClick={() => setPrintAudit(a)}><Printer size={13} /> Report</button></td>
              </tr>
            ))}
            {audits.length === 0 && <tr><td className="td text-pine/40" colSpan={6}>No audits yet.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

/* ---------------- A4 Night Audit report (print) ---------------- */
function NightAuditReport({ audit, company }) {
  const primary = 'var(--print-primary, #1B4D2E)'
  const s = audit?.summary || {}
  const revenue = s.revenue || {}
  const receipts = s.receipts || {}
  const totals = s.totals || { net: 0, sc: 0, vat: 0, total: 0 }
  const invoiceRows = s.invoiceRows || []
  const invoiceTotals = s.invoiceTotals || { invoice_total: 0, paid: 0, due: 0 }
  const recTotal = s.recTotal != null ? s.recTotal : Object.values(receipts).reduce((a, v) => a + (+v || 0), 0)
  const cell = { border: '1px solid #000', padding: '5px 8px', fontSize: 11 }
  const rt = { ...cell, textAlign: 'right', fontFamily: '"IBM Plex Mono", monospace' }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', color: '#000' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `2px solid ${primary}`, paddingBottom: 8, marginBottom: 12 }}>
        {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 50, width: 50, objectFit: 'contain' }} />}
        <div style={{ flex: 1, textAlign: company?.logo_url ? 'left' : 'center' }}>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'Fraunces, serif', color: primary }}>{company?.name || 'Resort'}</div>
          <div style={{ fontSize: 10.5 }}>{company?.address}{company?.phone ? ` · ${company.phone}` : ''}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, letterSpacing: 1, marginBottom: 4, textDecoration: 'underline' }}>NIGHT AUDIT — DAY-END REPORT</div>
      <table style={{ width: '100%', fontSize: 11, marginBottom: 10 }}>
        <tbody>
          <tr><td><b>Audit date:</b> {fmtDate(audit.audit_date)}</td><td style={{ textAlign: 'right' }}><b>Performed by:</b> {audit.performed_by || '—'}</td></tr>
          <tr><td><b>In-house at audit:</b> {s.inHouseCount != null ? s.inHouseCount : '—'}</td><td style={{ textAlign: 'right' }}><b>Journal voucher:</b> {audit.jv_status === 'POSTED' ? 'Posted' : audit.jv_status === 'PARTIAL' ? 'Partial' : '—'}</td></tr>
        </tbody>
      </table>

      <div style={{ fontSize: 12, fontWeight: 700, margin: '6px 0 4px' }}>A · Revenue posted (accrual)</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#eee' }}>
          <th style={cell}>Revenue head</th><th style={{ ...cell, textAlign: 'right' }}>Net</th><th style={{ ...cell, textAlign: 'right' }}>Service charge</th><th style={{ ...cell, textAlign: 'right' }}>VAT</th><th style={{ ...cell, textAlign: 'right' }}>Total</th>
        </tr></thead>
        <tbody>
          {Object.entries(revenue).map(([k, r]) => (
            <tr key={k}><td style={cell}>{k}</td><td style={rt}>{fmtBDT(r.net)}</td><td style={rt}>{fmtBDT(r.sc)}</td><td style={rt}>{fmtBDT(r.vat)}</td><td style={rt}>{fmtBDT(r.total)}</td></tr>
          ))}
          {Object.keys(revenue).length === 0 && <tr><td style={cell} colSpan={5}>No revenue posted on this date.</td></tr>}
        </tbody>
        <tfoot><tr style={{ fontWeight: 700, background: '#f5f5f5' }}>
          <td style={cell}>TOTAL</td><td style={rt}>{fmtBDT(totals.net)}</td><td style={rt}>{fmtBDT(totals.sc)}</td><td style={rt}>{fmtBDT(totals.vat)}</td><td style={rt}>{fmtBDT(totals.total)}</td>
        </tr></tfoot>
      </table>

      <div style={{ fontSize: 12, fontWeight: 700, margin: '14px 0 4px' }}>B · Receipts collected (cash basis)</div>
      <table style={{ width: '60%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#eee' }}><th style={cell}>Method</th><th style={{ ...cell, textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          {Object.entries(receipts).map(([m, v]) => <tr key={m}><td style={cell}>{m}</td><td style={rt}>{fmtBDT(v)}</td></tr>)}
          {Object.keys(receipts).length === 0 && <tr><td style={cell} colSpan={2}>No receipts on this date.</td></tr>}
        </tbody>
        <tfoot><tr style={{ fontWeight: 700, background: '#f5f5f5' }}><td style={cell}>TOTAL</td><td style={rt}>{fmtBDT(recTotal)}</td></tr></tfoot>
      </table>

      <div style={{ fontSize: 12, fontWeight: 700, margin: '14px 0 4px' }}>C · Invoice-wise snapshot (in-house)</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#eee' }}>
          <th style={cell}>Res No</th><th style={cell}>Guest</th><th style={cell}>Rooms</th><th style={cell}>Invoice</th><th style={{ ...cell, textAlign: 'right' }}>Invoice total</th><th style={{ ...cell, textAlign: 'right' }}>Paid</th><th style={{ ...cell, textAlign: 'right' }}>Due</th>
        </tr></thead>
        <tbody>
          {invoiceRows.map((r) => (
            <tr key={r.reservation_id}>
              <td style={cell}>{r.res_no}</td>
              <td style={cell}>{r.guest}</td>
              <td style={cell}>{r.rooms}</td>
              <td style={cell}>{r.invoice_no}</td>
              <td style={rt}>{fmtBDT(r.invoice_total)}</td>
              <td style={rt}>{fmtBDT(r.paid)}</td>
              <td style={rt}>{fmtBDT(r.due)}</td>
            </tr>
          ))}
          {invoiceRows.length === 0 && <tr><td style={cell} colSpan={7}>No in-house reservations on this date.</td></tr>}
        </tbody>
        <tfoot><tr style={{ fontWeight: 700, background: '#f5f5f5' }}>
          <td style={cell} colSpan={4}>TOTAL</td>
          <td style={rt}>{fmtBDT(invoiceTotals.invoice_total)}</td>
          <td style={rt}>{fmtBDT(invoiceTotals.paid)}</td>
          <td style={rt}>{fmtBDT(invoiceTotals.due)}</td>
        </tr></tfoot>
      </table>

      <div style={{ fontSize: 10, marginTop: 10, color: '#444' }}>Revenue is accrual (charges posted on the date); receipts are cash basis (money received on the date). The two need not match.</div>

      <table style={{ width: '100%', marginTop: 44, fontSize: 11 }}>
        <tbody><tr>
          <td style={{ width: '45%', borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>Night Auditor<br /><span style={{ fontSize: 10 }}>{audit.performed_by || ''}</span></td>
          <td style={{ width: '10%' }}></td>
          <td style={{ width: '45%', borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>Manager / Accounts</td>
        </tr></tbody>
      </table>
    </div>
  )
}
