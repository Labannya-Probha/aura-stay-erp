import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmtBDT, fmtDate, todayISO } from '../lib/helpers'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { Receipt, Trash2, Pencil, MessageCircle, Mail, Printer, X } from 'lucide-react'
import {
  generateReservationPaymentNo,
  parsePaymentReference,
  toPaymentReference,
} from '../lib/paymentNumber'
import { logAudit } from '../lib/pms.api.js'
import PaymentMethodFields, {
  validatePaymentMethodDetails,
} from '../components/payments/PaymentMethodFields.jsx'
import { applyPaymentScope, PAYMENT_SCOPES } from '../components/payments/paymentScope.js'
import { getCompanySettingsQuery } from '../lib/companySettings'
import { withTenantScope } from '../lib/companySettings'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { Textarea } from '../components/ui/textarea.jsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.jsx'
import PrintPortal from '../components/PrintPortal.jsx'
import ReservationPaymentReceipt from '../components/print/ReservationPaymentReceipt.jsx'

export default function ReservationPayments({
  userName,
  isAdmin,
  scope = PAYMENT_SCOPES.ACCOUNTING,
  reservationId = null,
  sourceModule = 'RESERVATIONS',
}) {
  const [reservations, setReservations] = useState([])
  const [payments, setPayments] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgKind, setMsgKind] = useState('ok')

  // ── new payment form ────────────────────────────────────────────
  const [f, setF] = useState({
    reservation_id: '',
    amount: '',
    method: 'CASH',
    reference: '',
    received_date: todayISO(),
    received_by: userName,
    paid_by_party: '',
    payment_class: 'SETTLEMENT',
    bank_account_id: '',
    card_type: '',
    cheque_number: '',
    cheque_date: '',
    pos_terminal_id: '',
    payer_bank_name: '',
    payer_branch_name: '',
    payer_routing_number: '',
  })
  const [methodErrors, setMethodErrors] = useState({})

  // ── edit state ──────────────────────────────────────────────────
  const [editRow, setEditRow] = useState(null)
  const [editForm, setEditForm] = useState({})

  // ── send dialog ──────────────────────────────────────────────────
  const [sendBox, setSendBox] = useState({
    open: false,
    channel: 'WHATSAPP',
    to: '',
    subject: '',
    body: '',
    file: null,
    payment: null,
  })
  const [sendBusy, setSendBusy] = useState(false)
  const [printPaymentDoc, setPrintPaymentDoc] = useState(null)
  const [company, setCompany] = useState(null)
  const fileInputClass =
    'h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30'

  const loadAll = async () => {
    const [{ data: rs }, { data: pm }] = await Promise.all([
      withTenantScope(
        supabase
          .from('reservations')
          .select('id,res_no,reservation_name, guests:primary_guest_id(full_name,phone,email)')
          .order('created_at', { ascending: false })
          .limit(300),
      ),
      applyPaymentScope(
        withTenantScope(
          supabase
            .from('payments')
            .select(
              'id,payment_id,reservation_id,received_date,amount,method,reference,received_by,paid_by_party,payment_class,source_module,bank_account_id,card_type,cheque_number,cheque_date,pos_terminal_id,payer_bank_name,payer_branch_name,payer_routing_number,reservations(res_no,reservation_name,check_in,check_out,primary_guest_id,guests:primary_guest_id(full_name,phone,email),reservation_rooms(rooms(room_no)))',
            )
            .order('received_date', { ascending: false })
            .limit(500),
        ),
        { scope, reservationId },
      ),
    ])
    setReservations(rs || [])
    setPayments(pm || [])

    const { data: companyRow } = await getCompanySettingsQuery(
      'tenant_id,tenant_name,name,company_name,address,phone,email,tin,bin,logo_url,software_name,primary_color,accent_color,secondary_color',
    )
      .limit(1)
      .maybeSingle()
    setCompany(companyRow || null)
  }

  useEffect(() => {
    loadAll()
  }, [scope, reservationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (text, kind = 'ok') => {
    setMsg(text)
    setMsgKind(kind)
    setTimeout(() => setMsg(''), 3500)
  }

  // ── Create ──────────────────────────────────────────────────────
  const addPayment = async () => {
    if (!f.reservation_id) {
      flash('Select a reservation first.', 'err')
      return
    }
    if (!f.amount || +f.amount <= 0) {
      flash('Enter a valid amount.', 'err')
      return
    }
    const validationErrors = validatePaymentMethodDetails(f)
    setMethodErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      flash('Complete the required payment method details.', 'err')
      return
    }

    setBusy(true)
    const paymentNo = await generateReservationPaymentNo()
    const { error } = await supabase.from('payments').insert({
      reservation_id: f.reservation_id,
      amount: +f.amount,
      method: f.method,
      reference: toPaymentReference(paymentNo, f.reference),
      received_date: f.received_date,
      received_by: f.received_by || userName,
      paid_by_party: f.paid_by_party || null,
      payment_class: f.payment_class || 'SETTLEMENT',
      source_module: sourceModule,
      bank_account_id: f.bank_account_id || null,
      card_type: f.card_type || null,
      cheque_number: f.cheque_number || null,
      cheque_date: f.cheque_date || null,
      pos_terminal_id: f.pos_terminal_id || null,
      payer_bank_name: f.payer_bank_name || null,
      payer_branch_name: f.payer_branch_name || null,
      payer_routing_number: f.payer_routing_number || null,
    })
    setBusy(false)
    if (error) {
      flash(error.message, 'err')
      return
    }
    setF({
      reservation_id: reservationId || '',
      amount: '',
      method: 'CASH',
      reference: '',
      received_date: todayISO(),
      received_by: userName,
      paid_by_party: '',
      payment_class: 'SETTLEMENT',
      bank_account_id: '',
      card_type: '',
      cheque_number: '',
      cheque_date: '',
      pos_terminal_id: '',
      payer_bank_name: '',
      payer_branch_name: '',
      payer_routing_number: '',
    })
    setMethodErrors({})
    await loadAll()
    flash('Reservation payment recorded.')
  }

  // ── Edit ────────────────────────────────────────────────────────
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
      bank_account_id: pm.bank_account_id || '',
      card_type: pm.card_type || '',
      cheque_number: pm.cheque_number || '',
      cheque_date: pm.cheque_date || '',
      pos_terminal_id: pm.pos_terminal_id || '',
      payer_bank_name: pm.payer_bank_name || '',
      payer_branch_name: pm.payer_branch_name || '',
      payer_routing_number: pm.payer_routing_number || '',
    })
  }

  const saveEdit = async () => {
    if (!editRow) return
    if (!editForm.amount || +editForm.amount <= 0) {
      flash('Enter a valid amount.', 'err')
      return
    }
    const validationErrors = validatePaymentMethodDetails(editForm)
    if (Object.keys(validationErrors).length) {
      flash('Complete the required payment method details.', 'err')
      return
    }
    const parsedCurrent = parsePaymentReference(editRow.reference)
    const paymentNo = parsedCurrent.paymentNo || (await generateReservationPaymentNo())
    const { error } = await supabase
      .from('payments')
      .update({
        amount: +editForm.amount,
        method: editForm.method,
        reference: toPaymentReference(paymentNo, editForm.reference),
        received_date: editForm.received_date,
        paid_by_party: editForm.paid_by_party || null,
        payment_class: editForm.payment_class || 'SETTLEMENT',
        bank_account_id: editForm.bank_account_id || null,
        card_type: editForm.card_type || null,
        cheque_number: editForm.cheque_number || null,
        cheque_date: editForm.cheque_date || null,
        pos_terminal_id: editForm.pos_terminal_id || null,
        payer_bank_name: editForm.payer_bank_name || null,
        payer_branch_name: editForm.payer_branch_name || null,
        payer_routing_number: editForm.payer_routing_number || null,
      })
      .eq('id', editRow.id)
    if (error) {
      flash(error.message || 'Update failed.', 'err')
      return
    }
    setEditRow(null)
    await loadAll()
    flash('Payment updated.')
  }

  // ── Delete ──────────────────────────────────────────────────────
  const delPayment = async (pm) => {
    if (
      !window.confirm(`Delete payment ${parsePaymentReference(pm.reference).paymentNo || pm.id}?`)
    )
      return
    const { error } = await supabase.from('payments').delete().eq('id', pm.id)
    if (error) {
      flash(error.message || 'Delete failed.', 'err')
      return
    }
    await loadAll()
    flash('Payment deleted.')
  }

  // ── Print ───────────────────────────────────────────────────────
  const printPayment = async (pm) => {
    const { data, error } = await withTenantScope(
      supabase
        .from('payments')
        .select(
          'id,payment_id,reservation_id,received_date,amount,method,reference,received_by,paid_by_party,payment_class,source_module,reservations(res_no,reservation_name,check_in,check_out,primary_guest_id,guests:primary_guest_id(full_name,phone,email),reservation_rooms(rooms(room_no)),balance_due)',
        )
        .eq('id', pm.id)
        .limit(1)
        .maybeSingle(),
    )

    if (error || !data) {
      flash(error?.message || 'Unable to load money receipt data for this tenant.', 'err')
      return
    }

    setPrintPaymentDoc(data)
    flash('Opening print preview...')
  }

  // ── Send (WhatsApp / Email) ──────────────────────────────────────
  const openSend = (channel, pm) => {
    const parsed = parsePaymentReference(pm.reference)
    const guest = pm.reservations?.guests
    const resName = pm.reservations?.reservation_name || guest?.full_name || '—'
    const msg = [
      `Reservation: ${pm.reservations?.res_no || '—'} — ${resName}`,
      `Payment ID: ${parsed.paymentNo || 'N/A'}`,
      `Amount: ${fmtBDT(Number(pm.amount || 0))}`,
      `Method: ${pm.method || '—'}`,
      `Date: ${pm.received_date || '—'}`,
    ].join('\n')
    const phone = (guest?.phone || '').replace(/[^\d]/g, '')
    setSendBox({
      open: true,
      channel,
      to: channel === 'EMAIL' ? guest?.email || '' : phone,
      subject: `Payment Receipt — ${parsed.paymentNo || pm.reservations?.res_no || ''}`,
      body: msg,
      file: null,
      payment: pm,
    })
  }

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
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
    const pm = sendBox.payment
    if (!pm) return
    if (!sendBox.to?.trim()) {
      flash('Recipient is required.', 'err')
      return
    }
    if (sendBox.file && sendBox.file.size > 10 * 1024 * 1024) {
      flash('Attachment too large. Max 10MB.', 'err')
      return
    }
    if (sendBox.channel === 'WHATSAPP' && sendBox.file && sendBox.file.type !== 'application/pdf') {
      flash('WhatsApp attachment must be a PDF file.', 'err')
      return
    }

    setSendBusy(true)
    try {
      const parsed = parsePaymentReference(pm.reference)
      if (sendBox.channel === 'WHATSAPP' && !sendBox.file) {
        const phone = sendBox.to.replace(/[^\d]/g, '')
        const intl = phone.startsWith('880')
          ? phone
          : phone.startsWith('0')
            ? `88${phone}`
            : `880${phone}`
        window.open(
          `https://wa.me/${intl}?text=${encodeURIComponent(sendBox.body || '')}`,
          '_blank',
        )
        await logAudit({
          actor: userName,
          action: 'SEND_WHATSAPP',
          entity: 'payment',
          entity_id: parsed.paymentNo || pm.id,
          details: {
            channel: 'WHATSAPP',
            to: sendBox.to,
            reservation_id: pm.reservation_id,
            payment_id: pm.id,
            mode: 'WA_FALLBACK',
          },
        })
        flash('WhatsApp window opened.')
        setSendBox({ ...sendBox, open: false })
        return
      }

      let attachmentPayload = null
      if (sendBox.file) {
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
          reservation_id: pm.reservation_id,
          payment_id: pm.id,
        },
      })

      if (error) {
        flash(error.message || 'Message dispatch failed.', 'err')
        return
      }
      if (data?.error) {
        flash(data.error, 'err')
        return
      }

      await logAudit({
        actor: userName,
        action: `SEND_${sendBox.channel}`,
        entity: 'payment',
        entity_id: parsed.paymentNo || pm.id,
        details: {
          channel: sendBox.channel,
          to: sendBox.to,
          reservation_id: pm.reservation_id,
          payment_id: pm.id,
        },
      })
      flash(`${sendBox.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'} sent successfully.`)
      setSendBox({ ...sendBox, open: false })
    } catch (err) {
      flash(err?.message || 'Message dispatch failed.', 'err')
    } finally {
      setSendBusy(false)
    }
  }

  const advanceTotal = useMemo(
    () =>
      payments
        .filter((p) => p.payment_class === 'ADVANCE' && Number(p.amount) > 0)
        .reduce((a, p) => a + Number(p.amount), 0),
    [payments],
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-pine">Reservation Payments</h1>
        <p className="text-sm text-pine/60">
          Record and review reservation/front-office payments with auto payment ID.
        </p>
      </div>

      {msg && (
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${msgKind === 'err' ? 'bg-red-50 text-red-700' : 'bg-forest/10 text-forest'}`}
        >
          {msg}
        </div>
      )}

      {/* ── Payment Entry Form ───────────────────────────────────── */}
      <div className="card p-4">
        <h3 className="font-display font-semibold text-pine mb-3 flex items-center gap-2">
          <Receipt size={16} className="text-forest" /> Reservation Payment Entry
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="label !text-xs">Reservation *</label>
            <SearchableSelect
              value={f.reservation_id}
              onChange={(v) => setF({ ...f, reservation_id: v })}
              options={reservations.map((r) => ({
                value: r.id,
                label: `${r.res_no} - ${r.reservation_name || r.guests?.full_name || 'Guest'}`,
              }))}
              placeholder="Select reservation…"
            />
          </div>
          <div>
            <label className="label !text-xs">Amount (৳) *</label>
            <Input
              type="number"
              className="money"
              value={f.amount}
              onChange={(e) => setF({ ...f, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="label !text-xs">Date</label>
            <Input
              type="date"
              value={f.received_date}
              onChange={(e) => setF({ ...f, received_date: e.target.value })}
            />
          </div>
          <div>
            <label className="label !text-xs">Method</label>
            <SearchableSelect
              value={f.method}
              onChange={(v) => setF({ ...f, method: v })}
              options={['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']}
              placeholder="Method…"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <PaymentMethodFields
              value={f}
              onChange={(next) => {
                setF(next)
                setMethodErrors({})
              }}
              errors={methodErrors}
              disabled={busy}
            />
          </div>
          <div>
            <label className="label !text-xs">Payment class</label>
            <SearchableSelect
              value={f.payment_class}
              onChange={(v) => setF({ ...f, payment_class: v })}
              options={[
                { value: 'ADVANCE', label: 'Advance' },
                { value: 'SETTLEMENT', label: 'Settlement' },
                { value: 'PARTIAL', label: 'Partial' },
              ]}
              placeholder="Class…"
            />
          </div>
          <div>
            <label className="label !text-xs">Paid by</label>
            <Input
              value={f.paid_by_party}
              onChange={(e) => setF({ ...f, paid_by_party: e.target.value })}
              placeholder="Guest/Agency"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="label !text-xs">Reference / TrxID</label>
            <Input
              value={f.reference}
              onChange={(e) => setF({ ...f, reference: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <Button onClick={addPayment} disabled={busy}>
              <Receipt size={15} /> {busy ? 'Saving…' : 'Save payment'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Payment History Table ────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-leaf font-display font-semibold text-pine flex items-center justify-between">
          <span>Reservation Payment History</span>
          <span className="text-xs text-forest">
            Advance Paid Total: <span className="money font-semibold">{fmtBDT(advanceTotal)}</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="th">Date</TableHead>
                <TableHead className="th">Payment ID</TableHead>
                <TableHead className="th">Reservation</TableHead>
                <TableHead className="th">Paid by</TableHead>
                <TableHead className="th">Class</TableHead>
                <TableHead className="th">Method</TableHead>
                <TableHead className="th">Reference</TableHead>
                <TableHead className="th text-right">Amount</TableHead>
                <TableHead className="th">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((pm) => {
                const parsedRef = parsePaymentReference(pm.reference)
                return (
                  <TableRow key={pm.id}>
                    <TableCell className="td text-xs">{fmtDate(pm.received_date)}</TableCell>
                    <TableCell className="td text-xs font-mono text-pine/80">
                      {parsedRef.paymentNo || '—'}
                    </TableCell>
                    <TableCell className="td text-xs">
                      <div className="font-semibold">{pm.reservations?.res_no || '—'}</div>
                      <div className="text-pine/50">
                        {pm.reservations?.reservation_name ||
                          pm.reservations?.guests?.full_name ||
                          '—'}
                      </div>
                    </TableCell>
                    <TableCell className="td text-xs">
                      {pm.paid_by_party || pm.received_by || '—'}
                    </TableCell>
                    <TableCell className="td text-xs">
                      <span
                        className={`status-chip text-xs ${
                          pm.payment_class === 'ADVANCE'
                            ? 'bg-amber/20 text-amber'
                            : pm.payment_class === 'SETTLEMENT'
                              ? 'bg-forest/15 text-forest'
                              : 'bg-sky-50 text-sky-700'
                        }`}
                      >
                        {pm.payment_class || 'SETTLEMENT'}
                      </span>
                    </TableCell>
                    <TableCell className="td text-xs">{pm.method}</TableCell>
                    <TableCell className="td text-xs">{parsedRef.reference || '—'}</TableCell>
                    <TableCell className="td money text-right font-semibold">
                      {fmtBDT(pm.amount)}
                    </TableCell>
                    <TableCell className="td">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="!px-2 text-xs"
                          title="Edit"
                          onClick={() => startEdit(pm)}
                        >
                          <Pencil size={12} />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="!px-2 text-xs text-red-600"
                            title="Delete"
                            onClick={() => delPayment(pm)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="xs"
                          className="!px-2 text-xs"
                          title="Print receipt"
                          onClick={() => printPayment(pm)}
                        >
                          <Printer size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="!px-2 text-xs text-green-700"
                          title="Send via WhatsApp"
                          onClick={() => openSend('WHATSAPP', pm)}
                        >
                          <MessageCircle size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="!px-2 text-xs text-blue-600"
                          title="Send via Email"
                          onClick={() => openSend('EMAIL', pm)}
                        >
                          <Mail size={12} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell className="td text-pine/50" colSpan={9}>
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Edit Modal ───────────────────────────────────────────── */}
      {editRow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-pine">Edit Payment</h3>
              <Button variant="ghost" size="icon-xs" onClick={() => setEditRow(null)}>
                <X size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label !text-xs">Amount (৳) *</label>
                <Input
                  type="number"
                  className="money"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="label !text-xs">Date</label>
                <Input
                  type="date"
                  value={editForm.received_date}
                  onChange={(e) => setEditForm({ ...editForm, received_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label !text-xs">Method</label>
                <SearchableSelect
                  value={editForm.method}
                  onChange={(v) => setEditForm({ ...editForm, method: v })}
                  options={['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']}
                  placeholder="Method…"
                />
              </div>
              <div className="col-span-2">
                <PaymentMethodFields value={editForm} onChange={setEditForm} disabled={busy} />
              </div>
              <div>
                <label className="label !text-xs">Payment class</label>
                <SearchableSelect
                  value={editForm.payment_class}
                  onChange={(v) => setEditForm({ ...editForm, payment_class: v })}
                  options={[
                    { value: 'ADVANCE', label: 'Advance' },
                    { value: 'SETTLEMENT', label: 'Settlement' },
                    { value: 'PARTIAL', label: 'Partial' },
                  ]}
                  placeholder="Class…"
                />
              </div>
              <div>
                <label className="label !text-xs">Paid by</label>
                <Input
                  value={editForm.paid_by_party}
                  onChange={(e) => setEditForm({ ...editForm, paid_by_party: e.target.value })}
                  placeholder="Guest/Agency"
                />
              </div>
              <div>
                <label className="label !text-xs">Reference</label>
                <Input
                  value={editForm.reference}
                  onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditRow(null)}>
                Cancel
              </Button>
              <Button onClick={saveEdit}>Save changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Modal ───────────────────────────────────────────── */}
      {sendBox.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-pine flex items-center gap-2">
                {sendBox.channel === 'WHATSAPP' ? (
                  <MessageCircle size={16} className="text-green-600" />
                ) : (
                  <Mail size={16} className="text-blue-600" />
                )}
                Send via {sendBox.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
              </h3>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSendBox({ ...sendBox, open: false })}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label !text-xs">
                  {sendBox.channel === 'WHATSAPP' ? 'Phone number' : 'Email address'} *
                </label>
                <Input
                  value={sendBox.to}
                  onChange={(e) => setSendBox({ ...sendBox, to: e.target.value })}
                  placeholder={sendBox.channel === 'WHATSAPP' ? '01XXXXXXXXX' : 'guest@email.com'}
                />
              </div>
              {sendBox.channel === 'EMAIL' && (
                <div>
                  <label className="label !text-xs">Subject</label>
                  <Input
                    value={sendBox.subject}
                    onChange={(e) => setSendBox({ ...sendBox, subject: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="label !text-xs">Message</label>
                <Textarea
                  className="h-32 resize-none"
                  value={sendBox.body}
                  onChange={(e) => setSendBox({ ...sendBox, body: e.target.value })}
                />
              </div>
              <div>
                <label className="label !text-xs">Attachment</label>
                <input
                  type="file"
                  accept={sendBox.channel === 'WHATSAPP' ? 'application/pdf' : undefined}
                  className={fileInputClass}
                  onChange={(e) => setSendBox({ ...sendBox, file: e.target.files?.[0] || null })}
                />
                <p className="text-[11px] text-pine/50 mt-1">
                  {sendBox.channel === 'WHATSAPP'
                    ? 'PDF attach করলে professional direct send হবে; না দিলে normal WhatsApp window open হবে (max 10MB).'
                    : 'Optional attachment (max 10MB).'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSendBox({ ...sendBox, open: false })}>
                Cancel
              </Button>
              <Button onClick={sendNow} disabled={sendBusy}>
                {sendBox.channel === 'WHATSAPP' ? <MessageCircle size={14} /> : <Mail size={14} />}
                {sendBusy ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {printPaymentDoc && (
        <PrintPortal
          title={`Reservation Payment Receipt — ${parsePaymentReference(printPaymentDoc.reference).paymentNo || printPaymentDoc.id}`}
          type="A4"
          autoPrint
          onClose={() => setPrintPaymentDoc(null)}
          primaryColor={company?.primary_color}
          accentColor={company?.accent_color}
        >
          <ReservationPaymentReceipt payment={printPaymentDoc} company={company} />
        </PrintPortal>
      )}
    </div>
  )
}
