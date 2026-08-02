import { useState } from 'react'
import { Printer, Receipt } from 'lucide-react'

import FrontOfficeDialogShell from './FrontOfficeDialogShell'
import { getCheckoutSettlementWarning } from './checkoutFlow.utils'
import { checkOutReservation, createDeposit } from '../services/frontOfficeActions.service'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { supabase } from '../../../lib/supabase'
import { withTenantScope } from '../../../lib/companySettings'
import { buildCheckoutBillPayload } from './checkoutPrint.utils'

const nativeSelectClass =
  'h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30'

export default function CheckOutDialog({
  open,
  reservation,
  userName,
  onClose,
  onCompleted,
  onPrintBill,
  company,
  guest,
}) {
  const [payment, setPayment] = useState(0)
  const [method, setMethod] = useState('CASH')
  const [printChoice, setPrintChoice] = useState('BILL')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handlePrintBill(type = 'BILL') {
    if (!reservation) return

    try {
      const [chargesResult, paymentsResult] = await Promise.all([
        withTenantScope(
          supabase
            .from('folio_charges')
            .select('*')
            .eq('reservation_id', reservation.reservationId)
            .order('charge_date', { ascending: true }),
        ),
        withTenantScope(
          supabase
            .from('payments')
            .select('*')
            .eq('reservation_id', reservation.reservationId)
            .order('received_date', { ascending: true }),
        ),
      ])

      if (chargesResult.error) throw chargesResult.error
      if (paymentsResult.error) throw paymentsResult.error

      const payload = buildCheckoutBillPayload({
        reservation,
        charges: chargesResult.data || [],
        payments: paymentsResult.data || [],
        company,
        guest,
        issuedAt: new Date().toISOString(),
      })

      onPrintBill?.({ ...payload, type })
    } catch (printError) {
      setError(printError.message || 'Unable to prepare the bill for printing.')
    }
  }

  async function submit() {
    if (!reservation) return

    const due = Number(reservation.balance || 0)
    const amount = Number(payment || 0)
    const warning = getCheckoutSettlementWarning({ due, amount })

    if (warning) {
      const confirmPartial = window.confirm(warning)
      if (!confirmPartial) return
    }

    setSaving(true)
    setError('')

    try {
      if (amount > 0) {
        await createDeposit({
          reservationId: reservation.reservationId,
          amount,
          method,
          receivedBy: userName,
          notes: 'Front office checkout settlement',
        })
      }

      await checkOutReservation({
        reservationId: reservation.reservationId,
        userName,
      })

      await onCompleted?.()
      await handlePrintBill(printChoice)
      onClose()
    } catch (actionError) {
      setError(actionError.message || 'Checkout could not be completed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FrontOfficeDialogShell
      open={open}
      title="Guest Check-out"
      subtitle={reservation ? `${reservation.reservationNo} · ${reservation.guestName}` : ''}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handlePrintBill('BILL')}
            disabled={!reservation}
          >
            <Printer size={16} className="mr-2" />
            Print Bill
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handlePrintBill('MUSHAK')}
            disabled={!reservation}
          >
            <Receipt size={16} className="mr-2" />
            Mushak Print
          </Button>

          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button type="button" disabled={saving} onClick={submit}>
            {saving ? 'Processing...' : 'Complete Check-out'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Summary label="Folio Total" value={reservation?.total} />
        <Summary label="Paid" value={reservation?.paid} />
        <Summary label="Outstanding" value={reservation?.balance} />

        <Field label="Settlement Amount">
          <Input
            type="number"
            value={payment}
            onChange={(event) => setPayment(event.target.value)}
          />
        </Field>

        <Field label="Payment Method">
          <select
            className={nativeSelectClass}
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            {['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK', 'OTHER'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>

        <Field label="Print Options">
          <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1.5">
            {[
              { value: 'BILL', label: 'Guest Bill', icon: Printer },
              { value: 'MUSHAK', label: 'Mushak', icon: Receipt },
            ].map((option) => {
              const Icon = option.icon
              const active = printChoice === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPrintChoice(option.value)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              )
            })}
          </div>
        </Field>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
    </FrontOfficeDialogShell>
  )
}

function Field({ label, children }) {
  return (
    <label>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <span className="text-xs font-black uppercase text-slate-400">{label}</span>
      <strong className="mt-1 block text-lg text-slate-950">
        ৳{Number(value || 0).toLocaleString('en-BD')}
      </strong>
    </div>
  )
}
