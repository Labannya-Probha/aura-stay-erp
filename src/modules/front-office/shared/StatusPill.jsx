const tone = {
  ARRIVAL: "bg-blue-50 text-blue-700",
  DEPARTURE: "bg-violet-50 text-violet-700",
  IN_HOUSE: "bg-emerald-50 text-emerald-700",
  DUE: "bg-red-50 text-red-700",
  CLEAN: "bg-emerald-50 text-emerald-700",
  DIRTY: "bg-red-50 text-red-700",
  INSPECTION: "bg-amber-50 text-amber-700",
  OOO: "bg-slate-100 text-slate-700",
}

export default function StatusPill({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone[status] || "bg-slate-100 text-slate-700"}`}>
      {String(status || "-").replaceAll("_", " ")}
    </span>
  )
}
