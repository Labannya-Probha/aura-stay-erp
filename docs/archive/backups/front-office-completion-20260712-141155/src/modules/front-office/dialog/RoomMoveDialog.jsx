import { useEffect, useMemo, useState } from "react"

import FrontOfficeDialogShell from "./FrontOfficeDialogShell"
import {
  getAvailableRooms,
  moveRoom,
} from "../services/frontOfficeActions.service"

const primaryButton =
  "rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-60"

const secondaryButton =
  "rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 hover:bg-slate-50"

export default function RoomMoveDialog({
  open,
  reservation,
  userName,
  onClose,
  onCompleted,
}) {
  const assignment = reservation?.rooms?.[0]
  const [rooms, setRooms] = useState([])
  const [newRoomId, setNewRoomId] = useState("")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !reservation) return

    getAvailableRooms({
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      excludeReservationId: reservation.reservationId,
    })
      .then(setRooms)
      .catch((loadError) =>
        setError(loadError.message)
      )
  }, [open, reservation])

  const selected = useMemo(
    () => rooms.find((room) => room.id === newRoomId),
    [rooms, newRoomId]
  )

  async function submit() {
    if (!assignment?.id) {
      setError("No active room assignment found.")
      return
    }

    if (!newRoomId) {
      setError("Select a new room.")
      return
    }

    setSaving(true)
    setError("")

    try {
      await moveRoom({
        reservationId: reservation.reservationId,
        assignmentId: assignment.id,
        oldRoomId: assignment.id,
        newRoomId,
        fromDate: reservation.checkIn,
        toDate: reservation.checkOut,
        rate: Number(
          selected?.base_rate ||
            assignment.baseRate ||
            0
        ),
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
      title="Room Move"
      subtitle={
        reservation
          ? `${reservation.guestName} · ${reservation.roomNumber}`
          : ""
      }
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
            {saving ? "Moving..." : "Move Room"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="New Room">
          <select
            className="input"
            value={newRoomId}
            onChange={(event) =>
              setNewRoomId(event.target.value)
            }
          >
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_no} · {room.room_name || room.room_type}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Reason">
          <input
            className="input"
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Guest request, maintenance..."
          />
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
