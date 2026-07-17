const IN_HOUSE_STATUSES = new Set(["CHECKED_IN"])
const HOUSEKEEPING_ATTENTION_STATUSES = new Set(["DIRTY", "INSPECT", "OUT_OF_ORDER", "OOO", "MAINTENANCE"])

function toIsoToday() {
  return new Date().toISOString().slice(0, 10)
}

function isArrivalToday(reservation, todayIso) {
  return reservation?.checkIn === todayIso
}

function isDepartureToday(reservation, todayIso) {
  return reservation?.checkOut === todayIso
}

function isInHouseReservation(reservation, todayIso) {
  if (!reservation) return false
  const inStayRange = reservation.checkIn <= todayIso && reservation.checkOut >= todayIso
  return inStayRange && IN_HOUSE_STATUSES.has(String(reservation.status || "").toUpperCase())
}

function formatDate(dateText) {
  if (!dateText) return "-"
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return dateText
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
}

function sortReservationsByPriority(a, b, todayIso) {
  const aInHouse = isInHouseReservation(a, todayIso)
  const bInHouse = isInHouseReservation(b, todayIso)
  if (aInHouse !== bInHouse) return aInHouse ? -1 : 1
  return String(a.checkIn || "").localeCompare(String(b.checkIn || ""))
}

function getReservationTone(status) {
  const normalized = String(status || "").toUpperCase()
  if (normalized === "CHECKED_IN") return "bg-blue-50 border-blue-200 text-blue-800"
  if (normalized === "TENTATIVE") return "bg-amber-50 border-amber-200 text-amber-800"
  if (normalized === "NO_SHOW") return "bg-rose-50 border-rose-200 text-rose-800"
  if (normalized === "BLOCKED") return "bg-slate-100 border-slate-300 text-slate-700"
  return "bg-emerald-50 border-emerald-200 text-emerald-800"
}

export default function BookingRoomCardBoard({
  rooms = [],
  reservations = [],
  loading = false,
  onSelectReservation,
}) {
  const todayIso = toIsoToday()

  const roomCards = rooms.map((room) => {
    const roomReservations = reservations
      .filter((reservation) => reservation.roomId === room.id)
      .sort((a, b) => sortReservationsByPriority(a, b, todayIso))
    const inHouse = roomReservations.find((reservation) => isInHouseReservation(reservation, todayIso)) || null
    const nearest = inHouse || roomReservations[0] || null

    return {
      room,
      inHouse,
      reservation: nearest,
    }
  })

  const inHouseCount = roomCards.filter((card) => card.inHouse).length
  const arrivalsCount = reservations.filter((reservation) => isArrivalToday(reservation, todayIso)).length
  const departuresCount = reservations.filter((reservation) => isDepartureToday(reservation, todayIso)).length
  const vacantCount = Math.max(roomCards.length - inHouseCount, 0)
  const hkAttentionCount = roomCards.filter(({ room }) => {
    const roomStatus = String(room?.status || "").toUpperCase()
    return HOUSEKEEPING_ATTENTION_STATUSES.has(roomStatus)
  }).length

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500 font-black uppercase tracking-wide">Occupancy</span>
          <span className="rounded-full bg-blue-700 px-3 py-1 font-bold text-white">In-house ({inHouseCount})</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-800">Arrival ({arrivalsCount})</span>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-semibold text-violet-800">Departure ({departuresCount})</span>
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">Vacant ({vacantCount})</span>
          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700">HK need attention ({hkAttentionCount})</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {roomCards.map(({ room, inHouse, reservation }) => {
          const headerTone = inHouse ? "bg-blue-700 text-white" : "bg-cyan-300 text-cyan-950"
          const statusLabel = inHouse ? "In-house" : "Vacant"
          const roomTypeLabel = room.type || "Room"

          return (
            <article key={room.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
              <div className={`flex items-center justify-between rounded-t-2xl px-3 py-2 ${headerTone}`}>
                <div className="font-black">{room.number}</div>
                <div className="text-sm font-semibold">{statusLabel}</div>
              </div>

              <div className="space-y-3 p-3">
                <p className="text-sm font-semibold text-slate-600">{roomTypeLabel}</p>

                {!reservation && (
                  <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-400">
                    No booking
                  </div>
                )}

                {reservation && (
                  <button
                    type="button"
                    onClick={() => onSelectReservation?.(reservation)}
                    className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${getReservationTone(reservation.status)}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Res: {reservation.id}</p>
                    <p className="mt-1 text-base font-bold">{reservation.guestName || "Guest"}</p>
                    <p className="mt-1 text-xs font-medium opacity-80">{formatDate(reservation.checkIn)} to {formatDate(reservation.checkOut)}</p>
                  </button>
                )}

                <button type="button" className="w-full rounded-full border border-emerald-300 bg-emerald-50 py-1.5 text-base font-semibold text-emerald-700 transition hover:bg-emerald-100">
                  Clean
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
