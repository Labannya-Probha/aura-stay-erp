import { BarChart3, ChevronRight, FileText, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

type ReportItem = {
  id?: string
  code?: string
  reportCode?: string
  route?: string
  title?: string
  name?: string
  reportName?: string
  report_name?: string
  description?: string
}

type ReportGroup = {
  department: { slug: string; name: string }
  reports: ReportItem[]
}

type ReportExplorerProps = {
  groups: ReportGroup[]
  selectedDepartment: string
  onDepartmentChange: (slug: string) => void
  favoriteKeys: Set<string>
}

function reportKey(report: ReportItem) {
  return String(report.reportCode || report.code || report.id || report.route || '')
}

export default function ReportExplorer({
  groups,
  selectedDepartment,
  onDepartmentChange,
  favoriteKeys,
}: ReportExplorerProps) {
  const favoriteCount = groups.reduce(
    (count, group) =>
      count + group.reports.filter((report) => favoriteKeys.has(reportKey(report))).length,
    0,
  )

  return (
    <aside className="report-explorer" aria-label="Report explorer">
      <div className="report-explorer__heading">
        <div>
          <span>Report explorer</span>
          <strong>All reports</strong>
        </div>
        <BarChart3 size={17} aria-hidden="true" />
      </div>

      <nav className="report-explorer__nav">
        <button
          type="button"
          className={selectedDepartment === 'all' ? 'is-active' : ''}
          onClick={() => onDepartmentChange('all')}
        >
          <span className="report-explorer__nav-label">
            <FileText size={15} />
            All reports
          </span>
          <span>{groups.reduce((sum, group) => sum + group.reports.length, 0)}</span>
        </button>

        <button
          type="button"
          className={selectedDepartment === 'favorites' ? 'is-active' : ''}
          onClick={() => onDepartmentChange('favorites')}
        >
          <span className="report-explorer__nav-label">
            <Star size={15} />
            Favorites
          </span>
          <span>{favoriteCount}</span>
        </button>

        <div className="report-explorer__divider" />

        {groups.map((group) => (
          <button
            key={group.department.slug}
            type="button"
            className={selectedDepartment === group.department.slug ? 'is-active' : ''}
            onClick={() => onDepartmentChange(group.department.slug)}
          >
            <span>{group.department.name}</span>
            <span>{group.reports.length}</span>
          </button>
        ))}
      </nav>

      <div className="report-explorer__footer">
        <Link to="/reports/schedules">
          Scheduled reports
          <ChevronRight size={14} />
        </Link>
      </div>
    </aside>
  )
}
