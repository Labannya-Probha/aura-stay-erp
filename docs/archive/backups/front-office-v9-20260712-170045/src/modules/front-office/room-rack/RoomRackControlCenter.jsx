import {
  BedDouble,
  CreditCard,
  MessageSquareText,
  ReceiptText,
  Wrench,
} from "lucide-react"

const statusTone = {
  VACANT: "border-emerald-200 bg-emerald-50",
  OCCUPIED: "border-sky-200 bg-sky-50",
  DIRTY: "border-amber-200 bg-amber-50",
  OUT_OF_ORDER: "border-slate-300 bg-slate-100",
  RESERVED: "border-violet-200 bg-violet-50",
}

function money(value) {
  return `৳${Number(value || 0).toLocaleString(
    "en-BD"
  )}`
}

export default function RoomRackControlCenter({
  rooms = [],
  loading = false,
  onOpenReservation,
  onOpenFolio,
  onOpenHousekeeping,
  onOpenMaintenance,
  onOpenMessages,
}) {
  if (loading) {
    return (
      <div className="h-[520px] animate-pulse rounded-3xl bg-slate-100" />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rooms.map((room) => {
        const state = room.occupied
          ? "OCCUPIED"
          : String(
              room.housekeepingStatus ||
                room.status ||
                "VACANT"
            ).toUpperCase()

        return (
          <article
            key={room.id}
            className={`rounded-3xl border p-5 shadow-sm ${
              statusTone[state] ||
              "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-black text-slate-950">
                  {room.number}
                </div>

                <div className="mt-1 text-sm font-bold text-slate-600">
                  {room.name}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {room.type} · {money(room.baseRate)}
                </div>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-slate-700 shadow-sm">
                <BedDouble size={20} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/70 p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Current Status
              </span>

              <strong className="mt-1 block text-sm text-slate-900">
                {state.replaceAll("_", " ")}
              </strong>

              <span className="mt-2 block text-sm font-bold text-slate-700">
                {room.guestName || "Vacant"}
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                {room.reservationNo || "No active reservation"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Action
                icon={ReceiptText}
                label="Reservation"
                onClick={() =>
                  onOpenReservation?.(
                    room.reservationId
                  )
                }
                disabled={!room.reservationId}
              />

              <Action
                icon={CreditCard}
                label="Folio"
                onClick={() =>
                  onOpenFolio?.(room)
                }
                disabled={!room.reservationId}
              />

              <Action
                icon={BedDouble}
                label="Housekeeping"
                onClick={() =>
                  onOpenHousekeeping?.(room)
                }
              />

              <Action
                icon={Wrench}
                label="Maintenance"
                onClick={() =>
                  onOpenMaintenance?.(room)
                }
              />

              <Action
                icon={MessageSquareText}
                label="Messages"
                onClick={() =>
                  onOpenMessages?.(room)
                }
                className="col-span-2"
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function Action({
  icon: Icon,
  label,
  onClick,
  disabled,
  className = "",
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white bg-white/80 px-3 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
