import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { useReportMetadata } from "../hooks/useReportMetadata"
import "../../../styles/aeds-v6-migration.css"

function cleanReportTitle(report) {
  const raw =
    report?.title ||
    report?.name ||
    report?.reportName ||
    report?.report_name ||
    "Report"

  return String(raw)
    .replace(/^RPT[-_\s]*\d+\s*[:\-–—]?\s*/i, "")
    .trim()
}

export default function ReportsLandingPage({ company, role }) {
  const { groups, loading } = useReportMetadata(role)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return groups

    return groups
      .map((group) => ({
        ...group,
        reports: group.reports.filter((report) =>
          `${cleanReportTitle(report)} ${report.description || ""}`
            .toLowerCase()
            .includes(query)
        ),
      }))
      .filter((group) =>
        group.department.name.toLowerCase().includes(query) ||
        group.reports.length > 0
      )
  }, [groups, searchQuery])

  const totalReports = groups.reduce(
    (sum, group) => sum + group.reports.length,
    0
  )

  return (
    <main className="aeds-v6-reports min-w-0 space-y-5">
      <header className="aeds-v6-reports-hero">
        <div className="aeds-v6-reports-heading">
          <div className="aeds-v6-reports-icon">
            <FileSpreadsheet size={24} />
          </div>

          <div>
            <div className="aeds-v6-eyebrow">
              <Sparkles size={14} />
              AEDS v6 Reporting Workspace
            </div>

            <h1>Reports Center</h1>

            <p>
              Live operational, financial and compliance reporting for{" "}
              {company?.name || "Aura Stay ERP"}.
            </p>
          </div>
        </div>

        <div className="aeds-v6-reports-meta">
          <div>
            <strong>{groups.length}</strong>
            <span>Departments</span>
          </div>
          <div>
            <strong>{totalReports}</strong>
            <span>Available reports</span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>Role protected</span>
          </div>
        </div>
      </header>

      <section className="aeds-v6-report-search">
        <Search size={17} />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search reports by name or purpose"
          aria-label="Search reports"
        />
      </section>

      {loading ? (
        <div className="aeds-v6-report-loading">
          Loading report catalog...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="aeds-v6-report-loading">
          No report matched “{searchQuery}”.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <article
              key={group.department.slug}
              className="aeds-v6-report-department"
            >
              <header>
                <div>
                  <span>Department</span>
                  <h2>{group.department.name}</h2>
                </div>

                <strong>{group.reports.length}</strong>
              </header>

              <div className="aeds-v6-report-list">
                {group.reports.slice(0, 6).map((report) => (
                  <Link
                    key={
                      report.reportCode ||
                      report.code ||
                      report.id ||
                      report.route
                    }
                    to={report.route}
                  >
                    <div>
                      <strong>{cleanReportTitle(report)}</strong>
                      <span>
                        {report.description ||
                          "Open live enterprise report"}
                      </span>
                    </div>

                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>

              {group.reports.length > 6 && (
                <Link
                  to={group.reports[0]?.route || "/reports"}
                  className="aeds-v6-view-more"
                >
                  View all {group.reports.length} reports
                  <ArrowRight size={15} />
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
