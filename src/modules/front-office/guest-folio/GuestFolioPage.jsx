export default function GuestFolioPage({ userName }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">Guest Folio Workspace</h2>
      <p className="mt-2 text-sm text-slate-500">
        Room charges, service postings, transfers, discounts, tax and payment history will be managed here.
      </p>
      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        Cashier user: {userName || "User"}
      </div>
    </section>
  )
}
