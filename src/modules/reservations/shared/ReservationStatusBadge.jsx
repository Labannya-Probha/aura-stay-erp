const tone = {
  DRAFT: "bg-slate-100 text-slate-700",
  TENTATIVE: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  GUARANTEED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  NO_SHOW: "bg-zinc-100 text-zinc-700",
}

export default function ReservationStatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone[status] || tone.DRAFT}`}>
      {String(status || "DRAFT").replaceAll("_", " ")}
    </span>
  )
}
