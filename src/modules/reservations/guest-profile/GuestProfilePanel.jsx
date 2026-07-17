export default function GuestProfilePanel({ guest }) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Guest Profile</h2>
      <p className="mt-1 text-sm text-slate-500">{guest?.name || "Select a guest to view profile."}</p>
    </aside>
  )
}
