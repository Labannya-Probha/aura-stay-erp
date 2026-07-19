import StatusPill from "../shared/StatusPill"

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`
}

export default function RoomRackPage({
  rows = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
    )
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-400">
        No room rack data found.
      </div>
    )
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rows.map((room) => (
        <article
          key={room.id}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-slate-950">
                {room.number}
              </div>

              <div className="mt-1 text-sm font-bold text-slate-600">
                {room.name}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {room.type} · {money(room.baseRate)}
              </div>
            </div>

            <StatusPill
              status={
                room.occupied
                  ? "OCCUPIED"
                  : room.status
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-slate-50 p-3">
              <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
                Housekeeping
              </span>
              <strong className="mt-1 block text-sm text-slate-800">
                {room.housekeepingStatus}
              </strong>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
                Balance
              </span>
              <strong className="mt-1 block text-sm text-slate-800">
                {money(room.balance)}
              </strong>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-100 p-4">
            <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
              Current Guest
            </span>
            <strong className="mt-1 block text-sm text-slate-900">
              {room.guestName}
            </strong>
            <span className="mt-1 block text-xs text-slate-500">
              {room.occupied
                ? `${room.reservationNo} · Checkout ${room.checkOut || "—"}`
                : "Room available"}
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}
