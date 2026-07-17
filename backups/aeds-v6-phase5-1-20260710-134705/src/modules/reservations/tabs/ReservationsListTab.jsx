import { Search } from "lucide-react"

export default function ReservationsListTab({ openReservation }) {
  return (
    <div className="aeds-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-lg font-black text-slate-950">Reservations</h2><p className="text-sm text-slate-500">Search and manage booking records.</p></div>
        <div className="aeds-input flex h-10 w-full max-w-md items-center gap-2 px-3"><Search size={16} className="text-slate-400" /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search reservation, guest, room..." /></div>
      </div>
      <div className="p-4">
        <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">
          Live reservation list will load here.
          <div className="mt-4"><button onClick={() => openReservation?.("demo")} className="aeds-btn-primary px-4 py-2 text-sm">Open Reservation</button></div>
        </div>
      </div>
    </div>
  )
}
