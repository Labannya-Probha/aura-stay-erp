import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, FileSpreadsheet, Search, ShieldCheck, Star } from 'lucide-react'

import ModuleLayout from '../../../components/shared/ModuleLayout'
import PermissionDebugStrip from '../../../components/debug/PermissionDebugStrip'
import { REPORT_CATEGORIES } from '../../../lib/reporting/reportConfig'
import { useReportMetadata } from '../hooks/useReportMetadata'
import { isUiDebugEnabled, recordPermissionHidden } from '../../../debug/uiDebug'
import ReportExplorer from '../components/ReportExplorer'
import '../../../styles/aeds-v6-migration.css'

const FAVORITES_KEY = 'aeds.reports.favorites.v1'
const RECENTS_KEY = 'aeds.reports.recents.v1'

type StoredRecent = {
  key: string
  route: string
  title: string
  department: string
  openedAt: string
}

function cleanReportTitle(report) {
  const raw = report?.title || report?.name || report?.reportName || report?.report_name || 'Report'
  return String(raw)
    .replace(/^RPT[-_\s]*\d+\s*[:\-–—]?\s*/i, '')
    .trim()
}

function reportKey(report) {
  return String(report?.reportCode || report?.code || report?.id || report?.route || '')
}

function readJsonArray<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function ReportsLandingPage({ company, role }) {
  const { groups, loading, error } = useReportMetadata(role)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(
    () => new Set(readJsonArray<string>(FAVORITES_KEY)),
  )
  const [recents, setRecents] = useState<StoredRecent[]>(() =>
    readJsonArray<StoredRecent>(RECENTS_KEY),
  )

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favoriteKeys)))
  }, [favoriteKeys])

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

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return groups
      .filter(
        (group) =>
          selectedDepartment === 'all' ||
          selectedDepartment === 'favorites' ||
          group.department.slug === selectedDepartment,
      )
      .map((group) => ({
        ...group,
        reports: group.reports.filter((report) => {
          const matchesFavorite =
            selectedDepartment !== 'favorites' || favoriteKeys.has(reportKey(report))
          const matchesQuery =
            !query ||
            `${cleanReportTitle(report)} ${report.description || ''} ${group.department.name}`
              .toLowerCase()
              .includes(query)
          return matchesFavorite && matchesQuery
        }),
      }))
      .filter((group) => group.reports.length > 0)
  }, [favoriteKeys, groups, searchQuery, selectedDepartment])

  const totalReports = groups.reduce((sum, group) => sum + group.reports.length, 0)

  const toggleFavorite = (key: string) => {
    setFavoriteKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const registerRecent = (report, departmentName: string) => {
    const item: StoredRecent = {
      key: reportKey(report),
      route: report.route,
      title: cleanReportTitle(report),
      department: departmentName,
      openedAt: new Date().toISOString(),
    }
    setRecents((current) => {
      const next = [item, ...current.filter((existing) => existing.key !== item.key)].slice(0, 5)
      window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
      return next
    })
  }

  const emptyTitle = searchQuery.trim()
    ? `No report matched “${searchQuery.trim()}”.`
    : selectedDepartment === 'favorites'
      ? 'No favorite reports yet.'
      : 'No reports available for this selection.'

  return (
    <ModuleLayout
      moduleName="reports"
      routeKey="reports.center"
      title="Reports Center"
      eyebrow="Reporting"
      description={`Operational, financial and compliance reports for ${company?.name || 'Aura Stay ERP'}.`}
      icon={FileSpreadsheet}
      kpis={
        <div className="report-center-meta">
          <span>
            <strong>{totalReports}</strong> reports
          </span>
          <span>
            <strong>{groups.length}</strong> departments
          </span>
          <span>
            <ShieldCheck size={15} /> Role protected
          </span>
        </div>
      }
      filterBar={
        <div className="report-center-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search report name, department or purpose"
            aria-label="Search reports"
          />
          {searchQuery ? (
            <button type="button" onClick={() => setSearchQuery('')}>
              Clear
            </button>
          ) : null}
        </div>
      }
      loading={loading}
      empty={false}
      error={error}
    >
      <PermissionDebugStrip
        label="Reports visibility debug"
        visibleCount={groups.length}
        hiddenCount={hiddenCategories.length}
        visibleLabel="report groups visible"
        hiddenLabel="categories hidden"
        detail={isUiDebugEnabled() ? `role: ${role || 'unknown'}` : undefined}
      />

      <div className="report-center-layout">
        <ReportExplorer
          groups={groups}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          favoriteKeys={favoriteKeys}
        />

        <main className="report-library">
          {selectedDepartment === 'all' && !searchQuery && recents.length > 0 ? (
            <section className="report-library__recent" aria-labelledby="recent-reports-title">
              <div className="report-library__section-heading">
                <div>
                  <span>Continue working</span>
                  <h2 id="recent-reports-title">Recent reports</h2>
                </div>
                <Clock3 size={17} />
              </div>
              <div className="report-recent-grid">
                {recents.map((item) => (
                  <Link key={item.key} to={item.route}>
                    <span>{item.department}</span>
                    <strong>{item.title}</strong>
                    <small>{new Date(item.openedAt).toLocaleDateString()}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="report-library__catalog" aria-labelledby="report-catalog-title">
            <div className="report-library__section-heading">
              <div>
                <span>
                  {selectedDepartment === 'favorites' ? 'Pinned workspace' : 'Report catalog'}
                </span>
                <h2 id="report-catalog-title">
                  {selectedDepartment === 'all'
                    ? 'All available reports'
                    : selectedDepartment === 'favorites'
                      ? 'Favorite reports'
                      : groups.find((group) => group.department.slug === selectedDepartment)
                          ?.department.name || 'Reports'}
                </h2>
              </div>
              <strong>
                {filteredGroups.reduce((sum, group) => sum + group.reports.length, 0)}
              </strong>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="report-library__empty">
                <FileSpreadsheet size={24} />
                <strong>{emptyTitle}</strong>
                <span>Change the department or search criteria.</span>
              </div>
            ) : (
              <div className="report-table" role="table" aria-label="Available reports">
                <div className="report-table__header" role="row">
                  <span>Report</span>
                  <span>Department</span>
                  <span>Purpose</span>
                  <span aria-label="Actions" />
                </div>

                {filteredGroups.flatMap((group) =>
                  group.reports.map((report) => {
                    const key = reportKey(report)
                    const favorite = favoriteKeys.has(key)
                    return (
                      <div className="report-table__row" role="row" key={key}>
                        <Link
                          to={report.route}
                          className="report-table__name"
                          onClick={() => registerRecent(report, group.department.name)}
                        >
                          <FileSpreadsheet size={17} />
                          <strong>{cleanReportTitle(report)}</strong>
                        </Link>
                        <span>{group.department.name}</span>
                        <span>{report.description || 'Open controlled enterprise report'}</span>
                        <div className="report-table__actions">
                          <button
                            type="button"
                            className={favorite ? 'is-favorite' : ''}
                            onClick={() => toggleFavorite(key)}
                            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
                          </button>
                          <Link
                            to={report.route}
                            onClick={() => registerRecent(report, group.department.name)}
                          >
                            Open <ArrowRight size={15} />
                          </Link>
                        </div>
                      </div>
                    )
                  }),
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </ModuleLayout>
  )
}
