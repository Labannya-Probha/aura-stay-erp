import { Link } from "react-router-dom"
import { FileSpreadsheet } from "lucide-react"
import { useReportMetadata } from "../hooks/useReportMetadata"

export default function ReportsLandingPage({ company, role }) {
  const { groups, loading } = useReportMetadata(role)

  return (
    <div>
      <main className="min-w-0 space-y-6">
        <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F4EC] text-[#1B4D2E]">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Reports Center</h1>
              <p className="mt-1 text-sm text-slate-500">
                Metadata-driven reporting for {company?.name || "Aura Stay ERP"}.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-400">
            Loading report catalog...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group.department.slug}
                to={group.reports[0]?.route || "/reports"}
                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2E7D32]"
              >
                <div className="text-sm font-black uppercase tracking-wide text-[#1B4D2E]">
                  {group.department.name}
                </div>
                <div className="mt-3 text-3xl font-black text-slate-950">{group.reports.length}</div>
                <p className="mt-1 text-sm text-slate-500">Available report(s)</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
