import { useEffect, useMemo, useState } from "react"

import FrontOfficeDialogShell from "./FrontOfficeDialogShell"
import {
  getAvailableRooms,
  moveRoom,
} from "../services/frontOfficeActions.service"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"

const nativeSelectClass =
  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"

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

    setError("")
    setNewRoomId("")
    setReason("")

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
    if (!assignment?.assignmentId) {
      setError("No active room assignment found.")
      return
    }

    if (!assignment?.roomId) {
      setError("Current room is missing.")
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
        assignmentId: assignment.assignmentId,
        oldRoomId: assignment.roomId,
        newRoomId,
        fromDate:
          assignment.fromDate || reservation.checkIn,
        toDate:
          assignment.toDate || reservation.checkOut,
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
          ? `${reservation.guestName} · Current Room ${assignment?.number || "—"}`
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
            {saving ? "Moving..." : "Move Room"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="New Room">
          <select
            className={nativeSelectClass}
            value={newRoomId}
            onChange={(event) =>
              setNewRoomId(event.target.value)
            }
          >
            <option value="">Select room</option>
            {rooms
              .filter((room) => room.id !== assignment?.roomId)
              .map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_no} · {room.room_name || room.room_type}
                </option>
              ))}
          </select>
        </Field>

        <Field label="Reason">
          <Input
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
