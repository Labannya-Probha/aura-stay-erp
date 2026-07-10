export default function NightAuditPage({ userName }) {
  const steps = [
    "Verify arrivals and no-shows",
    "Validate in-house folios",
    "Post room charges",
    "Close restaurant postings",
    "Generate audit reports",
    "Roll business date",
  ]

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">Night Audit Control Center</h2>
      <p className="mt-2 text-sm text-slate-500">
        Controlled end-of-day process operated by {userName || "Night Auditor"}.
      </p>

      <div className="mt-6 grid gap-3">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-slate-600 shadow-sm">
              {index + 1}
            </span>
            <span className="text-sm font-bold text-slate-700">{step}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
