import { useEffect, useState } from "react"

import FrontOfficeDialogShell from "./FrontOfficeDialogShell"
import {
  assignRoom,
  checkInReservation,
  createDeposit,
  getAvailableRooms,
  issueKeyCard,
  saveRegistrationCard,
} from "../services/frontOfficeActions.service"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"

const nativeSelectClass =
  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"

export default function CheckInDialog({
  open,
  reservation,
  userName,
  onClose,
  onCompleted,
}) {
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState("")
  const [rate, setRate] = useState(0)
  const [deposit, setDeposit] = useState(0)
  const [method, setMethod] = useState("CASH")
  const [cardNumber, setCardNumber] = useState("")
  const [idType, setIdType] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [address, setAddress] = useState("")
  const [vehicleNo, setVehicleNo] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !reservation) return

    setError("")

    getAvailableRooms({
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      excludeReservationId: reservation.reservationId,
    })
      .then((data) => {
        setRooms(data)
        const assignedRoomId =
          reservation.rooms?.[0]?.id || ""
        setRoomId(assignedRoomId)

        const assigned = data.find(
          (room) => room.id === assignedRoomId
        )
        setRate(
          Number(
            assigned?.base_rate ||
              reservation.rooms?.[0]?.baseRate ||
              0
          )
        )
      })
      .catch((loadError) =>
        setError(loadError.message)
      )
  }, [open, reservation])

  async function completeCheckIn() {
    if (!reservation) return

    if (!roomId) {
      setError("Select a room before check-in.")
      return
    }

    setSaving(true)
    setError("")

    try {
      await saveRegistrationCard({
        reservation_id: reservation.reservationId,
        guest_name: reservation.guestName,
        mobile: reservation.mobile,
        id_type: idType || null,
        id_number: idNumber || null,
        address: address || null,
        vehicle_no: vehicleNo || null,
        signed_at: new Date().toISOString(),
        signed_by: userName || null,
      })

      await assignRoom({
        reservationId: reservation.reservationId,
        roomId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        rate: Number(rate || 0),
      })

      if (Number(deposit) > 0) {
        await createDeposit({
          reservationId: reservation.reservationId,
          amount: Number(deposit),
          method,
          receivedBy: userName,
          notes: "Front office check-in deposit",
        })
      }

      if (cardNumber.trim()) {
        await issueKeyCard({
          reservationId: reservation.reservationId,
          roomId,
          cardNumber: cardNumber.trim(),
          issuedBy: userName,
          expiresAt: `${reservation.checkOut}T12:00:00`,
        })
      }

      await checkInReservation({
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
      title="Guest Check-in"
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
            onClick={completeCheckIn}
          >
            {saving ? "Processing..." : "Complete Check-in"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Room">
          <select
            className={nativeSelectClass}
            value={roomId}
            onChange={(event) => {
              const nextId = event.target.value
              setRoomId(nextId)

              const selected = rooms.find(
                (room) => room.id === nextId
              )

              setRate(
                Number(selected?.base_rate || 0)
              )
            }}
          >
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_no} · {room.room_name || room.room_type}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Room Rate">
          <Input
            type="number"
            value={rate}
            onChange={(event) =>
              setRate(event.target.value)
            }
          />
        </Field>

        <Field label="ID Type">
          <Input
            value={idType}
            onChange={(event) =>
              setIdType(event.target.value)
            }
            placeholder="NID / Passport"
          />
        </Field>

        <Field label="ID Number">
          <Input
            value={idNumber}
            onChange={(event) =>
              setIdNumber(event.target.value)
            }
          />
        </Field>

        <Field label="Address">
          <Input
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
          />
        </Field>

        <Field label="Vehicle No.">
          <Input
            value={vehicleNo}
            onChange={(event) =>
              setVehicleNo(event.target.value)
            }
          />
        </Field>

        <Field label="Deposit">
          <Input
            type="number"
            value={deposit}
            onChange={(event) =>
              setDeposit(event.target.value)
            }
          />
        </Field>

        <Field label="Deposit Method">
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

        <Field label="Key Card Number">
          <Input
            value={cardNumber}
            onChange={(event) =>
              setCardNumber(event.target.value)
            }
            placeholder="Optional"
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
