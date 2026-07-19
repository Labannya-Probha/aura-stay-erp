import { Link, useLocation } from "react-router-dom"
import { useReportMetadata } from "../hooks/useReportMetadata"

export default function ReportsMetadataSidebar({ role }) {
  const location = useLocation()
  const { groups, loading } = useReportMetadata(role)

  return (
    <aside className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
        Reports Library
      </h2>

      {loading && <div className="text-sm font-semibold text-slate-400">Loading reports...</div>}

      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.department.slug}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wide text-[#1B4D2E]">
                {group.department.name}
              </h3>
              <span className="rounded-full bg-[#F7F4EC] px-2 py-0.5 text-[10px] font-black text-[#1B4D2E]">
                {group.reports.length}
              </span>
            </div>

            <div className="space-y-1">
              {group.reports.map((report) => (
                <Link
                  key={report.reportCode}
                  to={report.route}
                  className={`block rounded-2xl px-3 py-2 text-sm font-semibold ${
                    location.pathname === report.route
                      ? "bg-[#1B4D2E] text-white"
                      : "text-slate-600 hover:bg-[#F7F4EC] hover:text-[#1B4D2E]"
                  }`}
                >
                  <span>{report.title}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  )
}
