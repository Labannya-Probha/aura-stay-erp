import { useMemo, useState } from "react"

import FrontOfficeDialogShell from "./FrontOfficeDialogShell"
import { amendStay } from "../services/frontOfficeActions.service"

const primaryButton =
  "rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-60"

const secondaryButton =
  "rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 hover:bg-slate-50"

function nights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0

  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)

  return Math.max(
    0,
    Math.round(
      (end.getTime() - start.getTime()) /
        86_400_000
    )
  )
}

export default function StayAmendDialog({
  open,
  reservation,
  userName,
  onClose,
  onCompleted,
}) {
  const [newCheckIn, setNewCheckIn] = useState(
    reservation?.checkIn || ""
  )
  const [newCheckOut, setNewCheckOut] = useState(
    reservation?.checkOut || ""
  )
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const currentNights = useMemo(
    () => nights(reservation?.checkIn, reservation?.checkOut),
    [reservation]
  )

  const amendedNights = useMemo(
    () => nights(newCheckIn, newCheckOut),
    [newCheckIn, newCheckOut]
  )

  if (!open || !reservation) return null

  async function submit() {
    if (!newCheckIn || !newCheckOut) {
      setError("Check-in and check-out dates are required.")
      return
    }

    if (newCheckOut <= newCheckIn) {
      setError("Check-out must be after check-in.")
      return
    }

    setSaving(true)
    setError("")

    try {
      await amendStay({
        reservationId: reservation.reservationId,
        newCheckIn,
        newCheckOut,
        userName,
        reason,
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
      title="Stay Amend"
      subtitle={`${reservation.reservationNo} · ${reservation.guestName}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className={secondaryButton}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className={primaryButton}
            disabled={saving}
            onClick={submit}
          >
            {saving ? "Updating..." : "Update Stay"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="New Check In">
          <input
            className="input"
            type="date"
            value={newCheckIn}
            onChange={(event) =>
              setNewCheckIn(event.target.value)
            }
          />
        </Field>

        <Field label="New Check Out">
          <input
            className="input"
            type="date"
            value={newCheckOut}
            onChange={(event) =>
              setNewCheckOut(event.target.value)
            }
          />
        </Field>

        <Summary
          label="Current Nights"
          value={currentNights}
        />

        <Summary
          label="Amended Nights"
          value={amendedNights}
        />

        <label className="md:col-span-2">
          <span className="label">Reason</span>
          <textarea
            className="input min-h-24"
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Guest request, extension, early departure..."
          />
        </label>
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
      <strong className="mt-1 block text-xl text-slate-950">
        {value}
      </strong>
    </div>
  )
}
