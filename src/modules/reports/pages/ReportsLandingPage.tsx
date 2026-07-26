import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileSpreadsheet, Search, ShieldCheck, Sparkles } from 'lucide-react'

import ModuleLayout from '../../../components/shared/ModuleLayout'
import PermissionDebugStrip from '../../../components/debug/PermissionDebugStrip'
import { REPORT_CATEGORIES } from '../../../lib/reporting/reportConfig'
import { useReportMetadata } from '../hooks/useReportMetadata'
import { isUiDebugEnabled, recordPermissionHidden } from '../../../debug/uiDebug'
import '../../../styles/aeds-v6-migration.css'

function cleanReportTitle(report) {
  const raw = report?.title || report?.name || report?.reportName || report?.report_name || 'Report'

  return String(raw)
    .replace(/^RPT[-_\s]*\d+\s*[:\-–—]?\s*/i, '')
    .trim()
}

export default function ReportsLandingPage({ company, role }) {
  const { groups, loading, error } = useReportMetadata(role)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return groups

    return groups
      .map((group) => ({
        ...group,
        reports: group.reports.filter((report) =>
          `${cleanReportTitle(report)} ${report.description || ''}`.toLowerCase().includes(query),
        ),
      }))
      .filter(
        (group) => group.department.name.toLowerCase().includes(query) || group.reports.length > 0,
      )
  }, [groups, searchQuery])

  const visibleDepartmentSlugs = useMemo(
    () => new Set(groups.map((group) => group.department?.slug).filter(Boolean)),
    [groups],
  )

  const hiddenCategories = useMemo(
    () => REPORT_CATEGORIES.filter((category) => !visibleDepartmentSlugs.has(category.slug)),
    [visibleDepartmentSlugs],
  )

  useEffect(() => {
    if (!isUiDebugEnabled() || hiddenCategories.length === 0) return

    hiddenCategories.forEach((category) => {
      recordPermissionHidden({
        moduleId: 'reports',
        label: category.name,
        reason: 'category hidden by role-scoped report catalog',
      })
    })
  }, [hiddenCategories])

  const totalReports = groups.reduce((sum, group) => sum + group.reports.length, 0)

  const emptyTitle = searchQuery.trim()
    ? `No report matched “${searchQuery.trim()}”.`
    : groups.length === 0
      ? 'No reports available for this role.'
      : 'No reports matched the current filter.'

  const emptyDescription = searchQuery.trim()
    ? 'Try a different report name, department, or purpose.'
    : 'If this looks wrong, check the report catalog privileges for the current role.'

  return (
    <ModuleLayout
      moduleName="reports"
      routeKey="reports.center"
      title="Reports Center"
      eyebrow={
        <span className="inline-flex items-center gap-2">
          <Sparkles size={14} /> AEDS v6 Reporting Workspace
        </span>
      }
      description={`Live operational, financial and compliance reporting for ${company?.name || 'Aura Stay ERP'}.`}
      icon={FileSpreadsheet}
      kpis={
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
      }
      filterBar={
        <section className="aeds-v6-report-search">
          <Search size={17} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search reports by name or purpose"
            aria-label="Search reports"
          />
        </section>
      }
      loading={loading}
      empty={!loading && filteredGroups.length === 0}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      error={error}
    >
      <div className="space-y-4">
        <PermissionDebugStrip
          label="Reports visibility debug"
          visibleCount={groups.length}
          hiddenCount={hiddenCategories.length}
          visibleLabel="report groups visible"
          hiddenLabel="categories hidden"
          detail={isUiDebugEnabled() ? `role: ${role || 'unknown'}` : undefined}
        />

        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <article key={group.department.slug} className="aeds-v6-report-department">
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
                    key={report.reportCode || report.code || report.id || report.route}
                    to={report.route}
                  >
                    <div>
                      <strong>{cleanReportTitle(report)}</strong>
                      <span>{report.description || 'Open live enterprise report'}</span>
                    </div>

                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>

              {group.reports.length > 6 && (
                <Link to={group.reports[0]?.route || '/reports'} className="aeds-v6-view-more">
                  View all {group.reports.length} reports
                  <ArrowRight size={15} />
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </ModuleLayout>
  )
}
