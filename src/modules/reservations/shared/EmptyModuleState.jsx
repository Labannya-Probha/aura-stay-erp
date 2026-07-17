export default function EmptyModuleState({ title, subtitle, action }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  )
}
