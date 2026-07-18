import { useState } from "react"

import FrontOfficeDialogShell from "./FrontOfficeDialogShell"
import {
  checkOutReservation,
  createDeposit,
} from "../services/frontOfficeActions.service"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"

const nativeSelectClass =
  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"

export default function CheckOutDialog({
  open,
  reservation,
  userName,
  onClose,
  onCompleted,
}) {
  const [payment, setPayment] = useState(0)
  const [method, setMethod] = useState("CASH")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!reservation) return

    const due = Number(reservation.balance || 0)
    const amount = Number(payment || 0)

    if (due > 0 && amount < due) {
      setError(
        `Outstanding balance is ৳${due.toLocaleString("en-BD")}.`
      )
      return
    }

    setSaving(true)
    setError("")

    try {
      if (amount > 0) {
        await createDeposit({
          reservationId: reservation.reservationId,
          amount,
          method,
          receivedBy: userName,
          notes: "Front office checkout settlement",
        })
      }

      await checkOutReservation({
        reservationId: reservation.reservationId,
        userName,
      })

      await onCompleted?.()
      onClose()
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FrontOfficeDialogShell
      open={open}
      title="Guest Check-out"
      subtitle={
        reservation
          ? `${reservation.reservationNo} · ${reservation.guestName}`
          : ""
      }
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={saving}
            onClick={submit}
          >
            {saving ? "Processing..." : "Complete Check-out"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Summary
          label="Folio Total"
          value={reservation?.total}
        />
        <Summary
          label="Paid"
          value={reservation?.paid}
        />
        <Summary
          label="Outstanding"
          value={reservation?.balance}
        />

        <Field label="Settlement Amount">
          <Input
            type="number"
            value={payment}
            onChange={(event) =>
              setPayment(event.target.value)
            }
          />
        </Field>

        <Field label="Payment Method">
          <select
            className={nativeSelectClass}
            value={method}
            onChange={(event) =>
              setMethod(event.target.value)
            }
          >
            {[
              "CASH",
              "BKASH",
              "NAGAD",
              "CARD",
              "BANK",
              "OTHER",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
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
      <span className="text-xs font-black uppercase text-slate-400">
        {label}
      </span>
      <strong className="mt-1 block text-lg text-slate-950">
        ৳{Number(value || 0).toLocaleString("en-BD")}
      </strong>
    </div>
  )
}
