import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  fmtBDT, fmtDate, todayISO, nightsBetween, eachNight,
  rateFor, computeCharge, sumCharges, applyRounding, STATUS_COLORS,
} from '../lib/helpers'
import { canManualCheckIn, getCheckInActionCopy } from '../lib/noShowAutomation'
import PrintPortal from '../components/PrintPortal.jsx'
import RegistrationCard from '../components/print/RegistrationCard.jsx'
import GuestBill from '../components/print/GuestBill.jsx'
import Mushak63 from '../components/print/Mushak63.jsx'
import { exportXLSX } from '../lib/helpers'
import {
  ArrowLeft, MessageCircle, Mail, CheckCircle2, LogIn, BedDouble,
  Plus, Trash2, Printer, FileDown, Receipt, BadgeCheck, Ban, Pencil, Save,
  Users, Handshake,
} from 'lucide-react'
import Quotation from '../components/print/Quotation.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { Combobox } from '../components/ui/combobox.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { Textarea } from '../components/ui/textarea.jsx'
import { generateReservationPaymentNo, toPaymentReference, parsePaymentReference } from '../lib/paymentNumber'
import { logAudit } from '../lib/pms.api.js'
import { getPrintBrandProps } from '../lib/companySettings'
import useReservationDetail from '../hooks/useReservationDetail.js'
import AddonTable from '../components/reservation/AddonTable.jsx'
import GuestProfileCard from '../components/reservation/GuestProfileCard.jsx'
import ReservationQuotationTab from './ReservationQuotationTab.jsx'

const TABS = ['Overview', 'Quotations', 'Payments']

export default function ReservationDetail({ id, back, userName, isAdmin }) {
  const {
    res,
    guest,
    guestCompany,
    resGuests,
    guestIds,
    resRooms,
    rooms,
    charges,
    payments,
    invoices,
    addons,
    taxConfig,
    company,
    loadAll,
    totals,
    paid,
    due,
    nights,
  } = useReservationDetail(id)
  const [searchParams] = useSearchParams()
  const initialTab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'Overview'
  const [tab, setTab] = useState(initialTab)
  const [printDoc, setPrintDoc] = useState(null)
  const [msg, setMsg] = useState('')
  const advancePaid = useMemo(
    () => payments
      .filter((p) => p.payment_class === 'ADVANCE' && Number(p.amount) > 0)
      .reduce((a, p) => a + Number(p.amount), 0),
    [payments],
  )

  const setStatus = async (status, extra = {}) => {
    await supabase.from('reservations').update({ status, ...extra }).eq('id', id)
    // Sync quotation status automatically
    const quoteStatusMap = {
      CONFIRMED: 'CONFIRMED',
      CANCELLED: 'CANCELLED',
      QUERY: 'DRAFT',
      QUOTED: 'DRAFT',
      CHECKED_IN: 'CONFIRMED',
      CHECKED_OUT: 'CONFIRMED',
      SETTLED: 'CONFIRMED',
    }
    const newQuoteStatus = quoteStatusMap[status]
    if (newQuoteStatus) {
      await supabase.from('quotations').update({ status: newQuoteStatus }).eq('reservation_id', id)
    }
    await loadAll()
  }

  if (!res) return <div className="text-pine/50">Loading…</div>

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={back}><ArrowLeft size={15} /> All reservations</Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-pine">{res.reservation_name || guest?.full_name}</h1>
          <span className={`status-chip ${STATUS_COLORS[res.status]}`}>{res.status.replace('_', ' ')}</span>
        </div>
        <div className="sm:text-right">
          <div className="text-xs uppercase text-pine/50">Guest advance paid</div>
          <div className="font-display text-2xl font-bold money text-forest">{fmtBDT(advancePaid)}</div>
        </div>
      </div>

      {msg && <div className="mb-4 px-4 py-2 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}

      {/* Tabs managed by sidebar context - no visible tab strip */}

      {tab === 'Overview' && (
        <Overview
          res={res} guest={guest} resRooms={resRooms} resGuests={resGuests} setStatus={setStatus}
          payments={payments} advance={paid} flash={flash} isAdmin={isAdmin} userName={userName}
          addons={addons} taxConfig={taxConfig}
        />
      )}
      {tab === 'Quotations' && (
        <ReservationQuotationTab
          res={res}
          guest={guest}
          resRooms={resRooms}
          addons={addons}
          taxConfig={taxConfig}
          company={company}
          nights={nights}
          reload={loadAll}
          flash={flash}
          setPrintDoc={setPrintDoc}
        />
      )}
      {tab === 'Payments' && (
        <ReservationPaymentsTab
          res={res}
          guest={guest}
          payments={payments}
          reload={loadAll}
          userName={userName}
          isAdmin={isAdmin}
          flash={flash}
          company={company}
        />
      )}


      {/* ================================================================
          PRINT PORTALS
          ================================================================ */}

      {printDoc?.type === 'REG' && (
        <PrintPortal title="Registration Card" onClose={() => setPrintDoc(null)} {...getPrintBrandProps(company)}>
          <RegistrationCard
            res={res} guest={guest} resGuests={resGuests}
            resRooms={resRooms} payments={payments} company={company}
          />
        </PrintPortal>
      )}

      {printDoc?.type === 'BILL' && printDoc?.phase !== 'RESORT' && (
        <PrintPortal title="Guest Bill" onClose={() => { if (window.confirm('Resort copy print করবেন?')) { setPrintDoc((prev) => ({ ...prev, phase: 'RESORT' })) } else { setPrintDoc(null) } }} {...getPrintBrandProps(company)}>
          <GuestBill
            charges={printDoc.invoiceData?.charges ?? []}
            line_snapshot={printDoc.invoiceData?.line_snapshot ?? []}
            totals={printDoc.invoiceData?.totals ?? totals}
            paid={printDoc.invoiceData?.paid ?? paid}
            due={printDoc.invoiceData?.due ?? due}
            res={res}
            guest={guest}
            guestCompany={guestCompany}
            company={company}
            invoice_no={printDoc.invoiceData?.invoice_no}
            issued_at={printDoc.invoiceData?.issued_at}
            buyer_name={printDoc.invoiceData?.buyer_name}
            buyer_address={printDoc.invoiceData?.buyer_address}
            buyer_bin={printDoc.invoiceData?.buyer_bin}
            copyLabel="Guest Copy"
            singleCopy
          />
        </PrintPortal>
      )}

      {printDoc?.type === 'BILL' && printDoc?.phase === 'RESORT' && (
        <PrintPortal title="Guest Bill (Resort Copy)" onClose={() => setPrintDoc(null)} {...getPrintBrandProps(company)}>
          <GuestBill
            charges={printDoc.invoiceData?.charges ?? []}
            line_snapshot={printDoc.invoiceData?.line_snapshot ?? []}
            totals={printDoc.invoiceData?.totals ?? totals}
            paid={printDoc.invoiceData?.paid ?? paid}
            due={printDoc.invoiceData?.due ?? due}
            res={res}
            guest={guest}
            guestCompany={guestCompany}
            company={company}
            invoice_no={printDoc.invoiceData?.invoice_no}
            issued_at={printDoc.invoiceData?.issued_at}
            buyer_name={printDoc.invoiceData?.buyer_name}
            buyer_address={printDoc.invoiceData?.buyer_address}
            buyer_bin={printDoc.invoiceData?.buyer_bin}
            copyLabel="Resort Copy"
            singleCopy
          />
        </PrintPortal>
      )}

      {printDoc?.type === 'MUSHAK' && (
        <PrintPortal title="Mushak-6.3" onClose={() => setPrintDoc(null)} {...getPrintBrandProps(company)}>
          <Mushak63
            charges={printDoc.invoiceData?.charges ?? []}
            line_snapshot={printDoc.invoiceData?.line_snapshot ?? []}
            totals={printDoc.invoiceData?.totals ?? totals}
            paid={printDoc.invoiceData?.paid ?? paid}
            due={printDoc.invoiceData?.due ?? due}
            res={res}
            guest={guest}
            guestCompany={guestCompany}
            company={company}
            invoice_no={printDoc.invoiceData?.invoice_no}
            issued_at={printDoc.invoiceData?.issued_at}
            buyer_name={printDoc.invoiceData?.buyer_name}
            buyer_address={printDoc.invoiceData?.buyer_address}
            buyer_bin={printDoc.invoiceData?.buyer_bin}
          />
        </PrintPortal>
      )}

      {printDoc?.type === 'QUOTE' && (
        <PrintPortal title="Quotation" onClose={() => { const cb = printDoc._afterClose; setPrintDoc(null); cb?.() }} {...getPrintBrandProps(company)}>
          <Quotation
            res={res}
            guest={guest}
            terms={printDoc.terms}
            roomRate={printDoc.roomRate}
            roomCount={printDoc.roomCount}
            discountPct={printDoc.discountPct}
            validDays={printDoc.validDays}
            taxConfig={taxConfig}
            company={company}
            resRooms={resRooms}
          />
        </PrintPortal>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  OVERVIEW TAB  (with single-quote row and full edit modal)          */
/* ------------------------------------------------------------------ */
function Overview({
  res, guest, resRooms, setStatus, payments, advance, flash,
  isAdmin, userName, addons = [], taxConfig = [],
}) {
  const canConfirm = ['QUERY', 'QUOTED'].includes(res.status)
  const isCompany = res.guest_type === 'Company'
  const [posting, setPosting] = useState(false)
  const unposted = addons.filter((a) => !a.posted)
  const lineTotal = (a) => Number(a.price) * Number(a.qty)

  const postAddonCharges = async () => {
    if (unposted.length === 0) { flash('No unposted addon items to post.'); return }
    setPosting(true)
    try {
      const rate = rateFor(taxConfig, 'OTHER', todayISO())
      for (const addon of unposted) {
        const calc = computeCharge(lineTotal(addon), 0, rate)
        const { data: fc, error: fcErr } = await supabase.from('folio_charges').insert({
          reservation_id: res.id,
          charge_date: todayISO(),
          charge_type: 'OTHER',
          description: `${addon.label}${addon.qty > 1 ? ` × ${addon.qty}` : ''}`,
          ...calc,
          created_by: userName,
        }).select().single()
        if (fcErr) throw fcErr
        const { error: updErr } = await supabase.from('reservation_addons').update({ posted: true, folio_charge_id: fc.id }).eq('id', addon.id)
        if (updErr) throw updErr
      }
      flash(`${unposted.length} addon item(s) posted to the folio.`)
    } catch (e) {
      flash(e.message || 'Failed to post addon charges.')
    }
    setPosting(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-5 lg:col-span-3">
        <h3 className="font-display font-semibold text-pine mb-3">Guest & stay</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="label">Primary guest</dt><dd className="font-semibold">{res.salutation ? `${res.salutation} ` : ''}{guest?.full_name || '—'}</dd></div>
          <div><dt className="label">Contact</dt><dd>{guest?.phone || '—'}{guest?.email ? ` · ${guest.email}` : ''}</dd></div>
          <div><dt className="label">Address</dt><dd>{guest?.address || '—'}</dd></div>
          <div><dt className="label">Source</dt><dd>{res.source}</dd></div>
          <div><dt className="label">Guest type</dt><dd>{res.guest_type || 'Individual'}</dd></div>
          <div><dt className="label">Reservation name</dt><dd>{res.reservation_name || '—'}{res.use_reservation_name_only && <span className="text-xs text-pine/50"> (used everywhere)</span>}</dd></div>
          <div><dt className="label">Discount</dt><dd>{res.discount_type === 'fixed' ? (Number(res.discount_val) > 0 ? `${fmtBDT(res.discount_val)} fixed` : '—') : (Number(res.discount_pct) > 0 ? `${res.discount_pct}%` : '—')}</dd></div>
          <div><dt className="label">Rooms assigned</dt><dd>{resRooms.length ? resRooms.map((r) => r.rooms?.room_no).join(', ') : 'Not yet assigned'}</dd></div>
          <div className="col-span-1 sm:col-span-2"><dt className="label">Notes</dt><dd>{res.notes || '—'}</dd></div>
        </dl>

        {isCompany && (
          <div className="mt-5 rounded-2xl border border-leaf bg-white/70 p-4">
            <h3 className="font-display font-semibold text-pine mb-3">Company / OTA terms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div><span className="label">Commission rate</span><div className="font-semibold money">{Number(res.commission_pct) || 0}%</div></div>
              <div><span className="label">Vat/VDS</span><div className="font-semibold money">{Number(res.vat_vds_pct) || 0}%</div></div>
              <div><span className="label">Tax/TDS</span><div className="font-semibold money">{Number(res.tax_tds_pct) || 0}%</div></div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <h3 className="font-display font-semibold text-pine mb-2">Including items</h3>
          {addons.length === 0 ? (
            <p className="text-sm text-pine/50">No additional items selected for this booking.</p>
          ) : (
            <AddonTable addons={addons} taxConfig={taxConfig} res={res} userName={userName} reload={() => {}} flash={flash} />
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-leaf">
          <div className="space-y-2">
            {canConfirm && (
              <Button className="w-full justify-center" onClick={() => {
                if (advance <= 0 && payments.length === 0) { flash('Record the advance payment first (Billings & Check-Out tab).'); return }
                setStatus('CONFIRMED'); flash('Booking confirmed.')
              }}>
                <CheckCircle2 size={16} /> Confirm booking
              </Button>
            )}
            {['QUERY', 'QUOTED', 'CONFIRMED'].includes(res.status) && (
              <Button variant="ghost" className="w-full justify-center text-red-600" onClick={() => setStatus('CANCELLED')}>
                <Ban size={15} /> Cancel reservation
              </Button>
            )}
            {unposted.length > 0 && (
              <Button variant="ghost" className="w-full justify-center" onClick={postAddonCharges} disabled={posting}>
                <Receipt size={15} /> {posting ? 'Posting...' : 'Post addon charges'}
              </Button>
            )}
            <p className="text-xs text-pine/50 pt-2">Advance received: <span className="money font-semibold">{fmtBDT(advance)}</span>.</p>
          </div>
        </div>
      </div>

      <GuestProfileCard guest={guest} reservationId={res.id} isAdmin={isAdmin} userName={userName} reload={() => {}} flash={flash} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PAYMENTS TAB                                                       */
/* ------------------------------------------------------------------ */
function ReservationPaymentsTab({ res, guest, payments, reload, userName, isAdmin, flash, company }) {
  const [p, setP] = useState({
    amount: '',
    method: 'CASH',
    reference: '',
    received_date: todayISO(),
    received_by: userName,
    paid_by_party: '',
    payment_class: 'SETTLEMENT',
  })
  const [editRow, setEditRow] = useState(null)
  const [editForm, setEditForm] = useState({ amount: '', method: 'CASH', reference: '', received_date: todayISO(), paid_by_party: '', payment_class: 'SETTLEMENT' })
  const [sendBox, setSendBox] = useState({ open: false, channel: 'WHATSAPP', to: '', subject: '', body: '', file: null, payment: null })
  const [deliveryLogs, setDeliveryLogs] = useState([])
  const [actionPopover, setActionPopover] = useState({ open: false, kind: 'success', message: '' })

  const showPopover = (message, kind = 'success') => {
    setActionPopover({ open: true, kind, message })
    setTimeout(() => setActionPopover((prev) => ({ ...prev, open: false })), 2800)
  }

  const loadDeliveryLogs = async () => {
    const { data } = await supabase
      .from('payment_delivery_logs')
      .select('*')
      .eq('reservation_id', res.id)
      .order('created_at', { ascending: false })
      .limit(200)
    setDeliveryLogs(data || [])
  }

  useEffect(() => { loadDeliveryLogs() }, [res.id])

  const addPayment = async () => {
    if (!p.amount || +p.amount <= 0) return
    const paymentNo = await generateReservationPaymentNo()
    const { error } = await supabase.from('payments').insert({
      reservation_id: res.id,
      amount: +p.amount,
      method: p.method,
      reference: toPaymentReference(paymentNo, p.reference),
      received_date: p.received_date,
      received_by: p.received_by,
      paid_by_party: p.paid_by_party || null,
      payment_class: p.payment_class || 'SETTLEMENT',
    })
    if (error) {
      showPopover(error.message || 'Payment save failed.', 'error')
      return
    }
    setP({ amount: '', method: 'CASH', reference: '', received_date: todayISO(), received_by: userName, paid_by_party: '', payment_class: 'SETTLEMENT' })
    await reload()
    showPopover('Payment recorded.')
  }

  const delPayment = async (pm) => {
    const { error } = await supabase.from('payments').delete().eq('id', pm.id)
    if (error) showPopover('Administrator access required to delete payments.', 'error')
    else {
      await reload()
      showPopover('Payment deleted.')
    }
  }

  const startEdit = (pm) => {
    const parsed = parsePaymentReference(pm.reference)
    setEditRow(pm)
    setEditForm({
      amount: String(pm.amount || ''),
      method: pm.method || 'CASH',
      reference: parsed.reference || '',
      received_date: pm.received_date || todayISO(),
      paid_by_party: pm.paid_by_party || '',
      payment_class: pm.payment_class || 'SETTLEMENT',
    })
  }

  const saveEdit = async () => {
    if (!editRow) return
    if (!editForm.amount || +editForm.amount <= 0) { showPopover('Enter a valid amount.', 'error'); return }
    const parsedCurrent = parsePaymentReference(editRow.reference)
    const paymentNo = parsedCurrent.paymentNo || await generateReservationPaymentNo()
    const { error } = await supabase
      .from('payments')
      .update({
        amount: +editForm.amount,
        method: editForm.method,
        reference: toPaymentReference(paymentNo, editForm.reference),
        received_date: editForm.received_date,
        paid_by_party: editForm.paid_by_party || null,
        payment_class: editForm.payment_class || 'SETTLEMENT',
      })
      .eq('id', editRow.id)
    if (error) { showPopover(error.message || 'Update failed.', 'error'); return }
    setEditRow(null)
    await reload()
    showPopover('Payment updated.')
  }

  const printPayment = (pm) => {
    const parsed = parsePaymentReference(pm.reference)
    const html = `<!doctype html><html><head><title>Payment Receipt</title></head><body style="font-family:Arial,sans-serif;padding:24px;">
      <h2>Reservation Payment Receipt</h2>
      <p><b>Reservation:</b> ${res.res_no || ''}</p>
      <p><b>Payment ID:</b> ${parsed.paymentNo || 'N/A'}</p>
      <p><b>Date:</b> ${pm.received_date || ''}</p>
      <p><b>Paid by:</b> ${pm.paid_by_party || pm.received_by || 'N/A'}</p>
      <p><b>Method:</b> ${pm.method || 'N/A'}</p>
      <p><b>Class:</b> ${pm.payment_class || 'SETTLEMENT'}</p>
      <p><b>Reference:</b> ${parsed.reference || 'N/A'}</p>
      <h3>Amount: ${fmtBDT(Number(pm.amount || 0))}</h3>
    </body></html>`
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    showPopover('Print পাঠানো হয়েছে.')
  }

  const buildProfessionalPaymentMessage = (pm, paymentNo) => {
    const guestName = guest?.full_name || res?.reservation_name || 'Guest'
    return [
      `Dear ${guestName},`,
      '',
      `Greetings from ${company?.name || 'Aura Stay'}.`,
      '',
      'Please find your payment details below:',
      `• Reservation No: ${res.res_no || '—'}`,
      `• Payment Slip No: ${paymentNo || 'N/A'}`,
      `• Amount: ${fmtBDT(Number(pm.amount || 0))}`,
      `• Method: ${pm.method || 'N/A'}`,
      `• Date: ${pm.received_date || ''}`,
      '',
      'A PDF copy of the payment slip/quotation is attached for your reference.',
      '',
      `Warm regards,`,
      `${company?.name || 'Aura Stay'}`,
      `${company?.phone || ''}`,
    ].join('\n')
  }

  const openSend = (channel, pm) => {
    const parsed = parsePaymentReference(pm.reference)
    const guestPhone = (guest?.phone || '').replace(/[^\d]/g, '')
    const msg = buildProfessionalPaymentMessage(pm, parsed.paymentNo)
    setSendBox({
      open: true,
      channel,
      to: channel === 'EMAIL' ? (guest?.email || '') : guestPhone,
      subject: `Payment Slip — ${parsed.paymentNo || res.res_no}`,
      body: msg,
      file: null,
      payment: pm,
    })
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : ''
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Could not read attachment'))
    reader.readAsDataURL(file)
  })

  const sendNow = async () => {
    if (!sendBox.payment) return
    if (!sendBox.to?.trim()) { showPopover('Recipient is required.', 'error'); return }

    let attachmentPayload = null
    if (sendBox.channel === 'WHATSAPP' && !sendBox.file) {
      const phone = sendBox.to.replace(/[^\d]/g, '')
      const intl = phone.startsWith('880') ? phone : phone.startsWith('0') ? `88${phone}` : `880${phone}`
      window.open(`https://wa.me/${intl}?text=${encodeURIComponent(sendBox.body || '')}`, '_blank')
      await logAudit({
        actor: userName, action: 'SEND_WHATSAPP', entity: 'payment',
        entity_id: parsePaymentReference(sendBox.payment?.reference).paymentNo || sendBox.payment?.id,
        details: { channel: 'WHATSAPP', to: sendBox.to, reservation_id: res?.id, payment_id: sendBox.payment?.id, mode: 'WA_FALLBACK' },
      })
      showPopover('WhatsApp window opened.')
      setSendBox({ ...sendBox, open: false })
      return
    }

    if (sendBox.file) {
      if (sendBox.file.size > 10 * 1024 * 1024) {
        showPopover('Attachment বেশি বড়। সর্বোচ্চ 10MB allowed.', 'error')
        return
      }
      if (sendBox.channel === 'WHATSAPP' && sendBox.file.type !== 'application/pdf') {
        showPopover('WhatsApp attachment অবশ্যই PDF হতে হবে.', 'error')
        return
      }
      const base64 = await fileToBase64(sendBox.file)
      attachmentPayload = {
        name: sendBox.file.name,
        type: sendBox.file.type || 'application/octet-stream',
        size: sendBox.file.size,
        base64,
      }
    }

    const { data, error } = await supabase.functions.invoke('send-payment-message', {
      body: {
        channel: sendBox.channel,
        to: sendBox.to.trim(),
        subject: sendBox.subject || 'Payment Receipt',
        message: sendBox.body || '',
        attachment: attachmentPayload,
        reservation_id: res.id,
        payment_id: sendBox.payment.id,
      },
    })

    if (error) {
      showPopover(error.message || 'Message dispatch failed.', 'error')
      return
    }
    if (data?.error) {
      showPopover(data.error, 'error')
      return
    }

    await loadDeliveryLogs()
    await logAudit({
      actor: userName, action: `SEND_${sendBox.channel}`, entity: 'payment',
      entity_id: parsePaymentReference(sendBox.payment?.reference).paymentNo || sendBox.payment?.id,
      details: { channel: sendBox.channel, to: sendBox.to, reservation_id: res?.id, payment_id: sendBox.payment?.id },
    })
    showPopover(`${sendBox.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'} sent successfully.`)
    setSendBox({ ...sendBox, open: false })
  }

  const latestLogByPayment = deliveryLogs.reduce((acc, row) => {
    if (!row.payment_id) return acc
    if (!acc[row.payment_id]) acc[row.payment_id] = row
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h3 className="font-display font-semibold text-pine mb-3 flex items-center gap-2">
          <Receipt size={16} className="text-forest" /> Reservation Payment
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label !text-xs">Amount (৳) *</label>
            <Input type="number" className="money"
              placeholder="0.00" value={p.amount}
              onChange={(e) => setP({ ...p, amount: e.target.value })} />
          </div>
          <div>
            <label className="label !text-xs">Payment method</label>
            <SearchableSelect
              value={p.method}
              onChange={v => setP({ ...p, method: v })}
              options={['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']}
              placeholder="Method…"
            />
          </div>
          <div>
            <label className="label !text-xs">Date</label>
            <Input type="date" value={p.received_date}
              onChange={(e) => setP({ ...p, received_date: e.target.value })} />
          </div>
          <div>
            <label className="label !text-xs">Reference / TrxID</label>
            <Input placeholder="Optional"
              value={p.reference} onChange={(e) => setP({ ...p, reference: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label !text-xs">Paid by</label>
            <SearchableSelect
              value={p.paid_by_party || ''}
              onChange={v => setP({ ...p, paid_by_party: v })}
              options={[
                { value: guest?.full_name || 'Guest', label: `👤 ${guest?.full_name || 'Guest'} (Guest)` },
                ...(res.agencies ? [{ value: res.agencies.name, label: `🤝 ${res.agencies.name} (Agency)` }] : []),
                ...(res.shareholders ? [{ value: res.shareholders.name, label: `👥 ${res.shareholders.name} (Shareholder)` }] : []),
              ].filter(Boolean)}
              placeholder="Select who is paying…"
              allowCreate
              onCreate={async (v) => v}
            />
          </div>
          <div>
            <label className="label !text-xs">Payment class</label>
            <SearchableSelect
              value={p.payment_class || 'SETTLEMENT'}
              onChange={v => setP({ ...p, payment_class: v })}
              options={[
                { value: 'ADVANCE', label: 'Advance' },
                { value: 'SETTLEMENT', label: 'Settlement' },
                { value: 'PARTIAL', label: 'Partial' },
              ]}
              placeholder="Class…"
            />
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <Button onClick={addPayment} disabled={!p.amount || +p.amount <= 0}>
              <Receipt size={15} /> Save payment
            </Button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden relative">
        {actionPopover.open && (
          <div className={`absolute right-4 top-3 z-10 px-3 py-2 rounded-lg shadow-lg text-xs font-semibold ${actionPopover.kind === 'error' ? 'bg-red-600 text-white' : 'bg-forest text-white'}`}>
            {actionPopover.message}
          </div>
        )}
        <div className="px-4 py-3 border-b border-leaf font-display font-semibold text-pine flex items-center justify-between gap-2">
          <span>Guest Reservation Payment History</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="th">Date</th><th className="th">Payment ID</th><th className="th">Paid by</th><th className="th">Class</th><th className="th">Method</th>
              <th className="th">Reference</th><th className="th text-right">Amount</th><th className="th">Delivery</th><th className="th">Actions</th>
            </tr></thead>
            <tbody>
              {payments.map((pm) => {
                const lg = latestLogByPayment[pm.id]
                return (
                <tr key={pm.id}>
                  <td className="td money text-xs">
                    {fmtDate(pm.received_date)}
                  </td>
                  <td className="td text-xs font-mono text-pine/80">{parsePaymentReference(pm.reference).paymentNo || '—'}</td>
                  <td className="td text-sm font-medium">{pm.paid_by_party || pm.received_by || '—'}</td>
                  <td className="td">
                    <span className={`status-chip text-xs ${
                      pm.payment_class === 'ADVANCE'    ? 'bg-amber/20 text-amber' :
                      pm.payment_class === 'SETTLEMENT' ? 'bg-forest/15 text-forest' :
                      'bg-sky-50 text-sky-700'
                    }`}>{pm.payment_class || 'SETTLEMENT'}</span>
                  </td>
                  <td className="td text-sm">{pm.method}</td>
                  <td className="td text-xs">{parsePaymentReference(pm.reference).reference || '—'}</td>
                  <td className="td money text-right font-semibold">{Number(pm.amount).toFixed(2)}</td>
                  <td className="td text-xs">
                    {lg ? (
                      <span className={`status-chip ${lg.status === 'SUCCESS' ? 'bg-forest/15 text-forest' : 'bg-red-100 text-red-600'}`}>
                        {lg.status}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      <Button variant="ghost" size="xs" className="text-xs" onClick={() => startEdit(pm)}>Edit</Button>
                      {isAdmin && <Button variant="ghost" size="xs" className="text-xs text-red-600" onClick={() => delPayment(pm)}>Delete</Button>}
                      <Button variant="ghost" size="xs" className="text-xs" onClick={() => printPayment(pm)}>Print</Button>
                      <Button variant="ghost" size="xs" className="text-xs" onClick={() => openSend('WHATSAPP', pm)}><MessageCircle size={12} /> WhatsApp</Button>
                      <Button variant="ghost" size="xs" className="text-xs" onClick={() => openSend('EMAIL', pm)}><Mail size={12} /> Email</Button>
                    </div>
                  </td>
                </tr>
              )})}
              {payments.length === 0 && <tr><td className="td text-pine/50" colSpan={9}>No payments recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-leaf font-display font-semibold text-pine">Delivery Log</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="th">Time</th><th className="th">Channel</th><th className="th">To</th><th className="th">Payment ID</th><th className="th">Status</th><th className="th">Message</th>
            </tr></thead>
            <tbody>
              {deliveryLogs.map((l) => (
                <tr key={l.id}>
                  <td className="td text-xs">{fmtDate(l.created_at)}</td>
                  <td className="td text-xs">{l.channel || '—'}</td>
                  <td className="td text-xs">{l.recipient || '—'}</td>
                  <td className="td text-xs font-mono">{l.payment_no || '—'}</td>
                  <td className="td text-xs">
                    <span className={`status-chip ${l.status === 'SUCCESS' ? 'bg-forest/15 text-forest' : 'bg-red-100 text-red-600'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="td text-xs text-pine/70">{l.error_message || l.provider_message || 'Delivered'}</td>
                </tr>
              ))}
              {deliveryLogs.length === 0 && <tr><td className="td text-pine/50" colSpan={6}>No delivery logs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editRow && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4">
          <div className="card w-full max-w-xl p-5 space-y-3">
            <h4 className="font-display font-semibold text-pine">Edit Payment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label !text-xs">Amount</label><Input type="number" className="money" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></div>
              <div><label className="label !text-xs">Method</label><SearchableSelect value={editForm.method} onChange={(v) => setEditForm({ ...editForm, method: v })} options={['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']} /></div>
              <div><label className="label !text-xs">Date</label><Input type="date" value={editForm.received_date} onChange={(e) => setEditForm({ ...editForm, received_date: e.target.value })} /></div>
              <div><label className="label !text-xs">Reference</label><Input value={editForm.reference} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} /></div>
              <div><label className="label !text-xs">Paid by</label><Input value={editForm.paid_by_party} onChange={(e) => setEditForm({ ...editForm, paid_by_party: e.target.value })} /></div>
              <div><label className="label !text-xs">Class</label><SearchableSelect value={editForm.payment_class} onChange={(v) => setEditForm({ ...editForm, payment_class: v })} options={['ADVANCE', 'SETTLEMENT', 'PARTIAL']} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditRow(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Update</Button>
            </div>
          </div>
        </div>
      )}

      {sendBox.open && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-5 space-y-3">
            <h4 className="font-display font-semibold text-pine">Send via {sendBox.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label !text-xs">To</label>
                <Input value={sendBox.to} onChange={(e) => setSendBox({ ...sendBox, to: e.target.value })} placeholder={sendBox.channel === 'WHATSAPP' ? 'Phone number' : 'Email address'} />
              </div>
              {sendBox.channel === 'EMAIL' && (
                <div>
                  <label className="label !text-xs">Subject</label>
                  <Input value={sendBox.subject} onChange={(e) => setSendBox({ ...sendBox, subject: e.target.value })} />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="label !text-xs">Message Body (Editable)</label>
                <Textarea className="min-h-[140px]" value={sendBox.body} onChange={(e) => setSendBox({ ...sendBox, body: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label !text-xs">Attachment</label>
                <input
                  type="file"
                  accept={sendBox.channel === 'WHATSAPP' ? 'application/pdf' : undefined}
                  className="input"
                  onChange={(e) => setSendBox({ ...sendBox, file: e.target.files?.[0] || null })}
                />
                <p className="text-[11px] text-pine/50 mt-1">
                  {sendBox.channel === 'WHATSAPP'
                    ? 'PDF দিলে professional direct dispatch হবে; না দিলে WhatsApp window open হবে (max 10MB)।'
                    : 'Email এর জন্য attachment optional। সর্বোচ্চ 10MB।'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSendBox({ ...sendBox, open: false })}>Cancel</Button>
              <Button onClick={sendNow}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
