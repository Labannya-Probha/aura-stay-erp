import StatusPill from "../shared/StatusPill"

export default function RoomRackPage({ rows = [], loading = false }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-400">
        No room rack data found
      </div>
    )
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map((room) => (
        <div key={room.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-slate-950">{room.number || room.roomNumber}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">{room.type || "Room"}</div>
            </div>
            <StatusPill status={room.status || "CLEAN"} />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">Current Guest</div>
            <div className="mt-1 text-sm font-bold text-slate-800">{room.guestName || "Vacant"}</div>
          </div>
        </div>
      ))}
    </section>
  )
}
