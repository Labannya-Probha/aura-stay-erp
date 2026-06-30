import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Download, FileDown, Printer, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import PrintPortal from '../components/PrintPortal'
import EnterpriseReportHeader from '../components/reports/EnterpriseReportHeader'
import EnterpriseReportFooter from '../components/reports/EnterpriseReportFooter'
import ReportFilterPanel from '../components/reports/ReportFilterPanel'
import ReportKpiCards from '../components/reports/ReportKpiCards'
import DynamicReportTable, { calculateTotals } from '../components/reports/DynamicReportTable'
import ReportPrintDocument from '../components/reports/ReportPrintDocument'
import {
  getDefaultFilters,
  REPORT_CATEGORIES,
} from '../lib/reporting/reportConfig'
import { loadLiveReportData } from '../lib/reporting/liveReportData'
import { exportReportCsv, exportReportExcel, exportReportPdf } from '../lib/reporting/reportExport'
import { todayISO } from '../lib/helpers'
import { buildBrandTheme } from '../lib/branding'
import { getRoleDefaultReportCatalog, getTenantReportContext, loadTenantReportCatalog, logReportExport, logReportPrint } from '../lib/reporting/tenantReporting'

export default function Reports({ userName, userId, role, company }) {
  const [activeCode, setActiveCode] = useState('IFRS-PNL')
  const [filters, setFilters] = useState(() => getDefaultFilters(todayISO))
  const [search, setSearch] = useState('')
  const [printSize, setPrintSize] = useState('A4')
  const [printReport, setPrintReport] = useState(null)
  const [openCategories, setOpenCategories] = useState({ IFRS: true, HOTEL_KPI: false, POS: false, ACCOUNTING: false })
  const [reportData, setReportData] = useState({ rows: [], kpis: {}, sourceCounts: {}, errors: [] })
  const [tenantReports, setTenantReports] = useState(() => getRoleDefaultReportCatalog(role))
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [loading, setLoading] = useState(false)

  const activeReport = useMemo(
    () => tenantReports.find((report) => report.code === activeCode) || tenantReports[0],
    [activeCode, tenantReports]
  )
  const activeKpiKeys = activeReport?.kpis?.length ? activeReport.kpis : ['totalRevenue', 'roomRevenue', 'restaurantRevenue', 'outstandingReceivable']
  const rows = reportData.rows
  const totals = useMemo(() => activeReport ? calculateTotals(activeReport.columns, rows) : {}, [activeReport, rows])
  const sourceCount = Object.values(reportData.sourceCounts || {}).reduce((sum, count) => sum + Number(count || 0), 0)
  const reportTheme = useMemo(() => buildBrandTheme({
    primary: company?.primary_color || company?.brand_primary,
    accent: company?.accent_color || company?.brand_accent,
    printPrimary: company?.print_primary_color || company?.brand_primary || company?.primary_color,
    printAccent: company?.print_accent_color || company?.brand_accent || company?.accent_color,
  }), [company])
  const reportStyle = {
    '--erp-blue': reportTheme.printPrimary,
    '--erp-blue-2': reportTheme.primary,
    '--erp-accent': reportTheme.printAccent,
  }
  const tenantContext = useMemo(() => getTenantReportContext(company, role), [company, role])
  const meta = {
    companyName: company?.software_name || company?.name || 'Aura Stay',
    propertyName: filters.property === 'All Properties' ? company?.name || 'All Properties' : filters.property,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    currency: filters.currency,
    generatedBy: userName,
  }

  useEffect(() => {
    let cancelled = false
    setCatalogLoading(true)
    loadTenantReportCatalog({ role, userId })
      .then((reports) => {
        if (cancelled) return
        setTenantReports(reports)
        if (!reports.some((report) => report.code === activeCode)) {
          setActiveCode(reports[0]?.code || 'IFRS-PNL')
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })
    return () => { cancelled = true }
  }, [role, userId])

  useEffect(() => {
    if (!activeReport) return
    let cancelled = false
    setLoading(true)
    loadLiveReportData(activeReport, filters)
      .then((data) => {
        if (!cancelled) setReportData(data)
      })
      .catch((error) => {
        if (!cancelled) setReportData({ rows: [], kpis: {}, sourceCounts: {}, errors: [error.message] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [activeReport, filters])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const selectReport = (report) => {
    setActiveCode(report.code)
    setOpenCategories((current) => ({ ...current, [report.category]: true }))
  }
  const toggleCategory = (code) => setOpenCategories((current) => ({ ...current, [code]: !current[code] }))
  const filteredTemplates = tenantReports.filter((report) =>
    !search || `${report.code} ${report.name} ${report.reportCategory}`.toLowerCase().includes(search.toLowerCase())
  )
  const exportAndLog = async (format) => {
    if (!activeReport) return
    await logReportExport({ report: activeReport, format, filters, userId, userName })
    if (format === 'CSV') return exportReportCsv(activeReport, rows, totals, meta)
    if (format === 'PDF') return exportReportPdf(activeReport, rows, totals, meta)
    return exportReportExcel(activeReport, rows, totals, meta)
  }
  const openPrint = async () => {
    if (!activeReport) return
    await logReportPrint({ report: activeReport, pageSize: printSize, filters, userId, userName })
    setPrintReport(activeReport)
  }

  return (
    <div className="enterprise-reporting-module" style={reportStyle}>
      {!activeReport ? (
        <section className="erp-report-canvas">
          <div className="erp-report-warning no-print">
            No reports are assigned to this tenant role. Ask a tenant administrator to grant report access.
          </div>
        </section>
      ) : null}
      {activeReport && printReport && (
        <PrintPortal
          title={`${printReport.name} - ${printSize} landscape`}
          onClose={() => setPrintReport(null)}
          primaryColor={reportTheme.printPrimary}
          accentColor={reportTheme.printAccent}
          type={printSize === 'A3' ? 'A3-landscape' : 'A4-landscape'}
        >
          <div className={printSize === 'A3' ? 'print-a3-landscape' : 'print-a4-landscape'}>
            <ReportPrintDocument company={company} report={printReport} filters={filters} rows={rows} generatedBy={userName} />
          </div>
        </PrintPortal>
      )}

      <section className="erp-dashboard-top no-print">
        <div>
          <h1>Reports</h1>
          <p>{tenantContext.tenantName} - {activeReport?.code || 'No report'} - {activeReport?.name || 'Access required'}</p>
        </div>
        <div className="erp-top-actions">
          <select className="input" value={printSize} onChange={(e) => setPrintSize(e.target.value)}>
            <option value="A4">A4 Landscape</option>
            <option value="A3">A3 Landscape</option>
          </select>
          <Button variant="outline" disabled={!activeReport?.exportPermission} onClick={() => exportAndLog('CSV')}>
            <Download size={15} /> CSV
          </Button>
          <Button variant="outline" disabled={!activeReport?.exportPermission} onClick={() => exportAndLog('PDF')}>
            <FileDown size={15} /> PDF
          </Button>
          <Button variant="outline" disabled={!activeReport?.printPermission} onClick={openPrint}>
            <Printer size={15} /> Print
          </Button>
          <Button disabled={!activeReport?.exportPermission} onClick={() => exportAndLog('EXCEL')}>
            <Download size={15} /> Excel
          </Button>
        </div>
      </section>

      <section className="erp-workspace">
        <aside className="erp-report-sidebar no-print">
          <div className="erp-sidebar-title">
            <strong>Report Menu</strong>
            <span>{catalogLoading ? 'Loading' : `${tenantReports.length} allowed`}</span>
          </div>
          <div className="erp-sidebar-search">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find reports" />
          </div>
          {REPORT_CATEGORIES.map((category) => {
            const Icon = category.icon
            const categoryReports = filteredTemplates.filter((report) => report.category === category.code)
            const active = activeReport.category === category.code
            const open = openCategories[category.code] || Boolean(search)
            if (categoryReports.length === 0) return null
            return (
              <div key={category.code} className="erp-sidebar-group">
                <button
                  type="button"
                  className={`erp-sidebar-group-btn ${active ? 'active' : ''}`}
                  onClick={() => toggleCategory(category.code)}
                >
                  <Icon size={16} />
                  <span>{category.name}</span>
                  <Badge variant="outline">{categoryReports.length}</Badge>
                  <ChevronDown size={14} className={open ? 'open' : ''} />
                </button>
                {open && (
                  <div className="erp-sidebar-report-list">
                    {categoryReports.map((report) => (
                      <button
                        type="button"
                        key={report.code}
                        className={activeCode === report.code ? 'selected' : ''}
                        onClick={() => selectReport(report)}
                      >
                        <span>{report.code}</span>
                        <b>{report.name}</b>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </aside>

        {activeReport && <main className="erp-report-canvas">
          <EnterpriseReportHeader company={company} report={activeReport} filters={filters} generatedBy={userName} />
          <div className="erp-live-report-status no-print">
            <span className={loading ? 'loading' : 'ready'}>{loading ? 'Loading tenant records...' : 'Tenant isolated data'}</span>
            <b>{rows.length} report rows</b>
            <small>{sourceCount} tenant records scanned</small>
            <small>Role: {role || 'User'}</small>
          </div>
          {reportData.errors?.length > 0 && (
            <div className="erp-report-warning no-print">
              {reportData.errors.join(' ')}
            </div>
          )}
          <ReportKpiCards values={reportData.kpis} activeKeys={activeKpiKeys} />
          <ReportFilterPanel
            filters={filters}
            onChange={updateFilter}
            search={search}
            onSearchChange={setSearch}
            activeFilterKeys={activeReport.filters}
            filterOptions={reportData.filterOptions}
          />
          <DynamicReportTable report={activeReport} rows={rows} search={search} />
          <EnterpriseReportFooter printedBy={userName} />
        </main>}
      </section>
    </div>
  )
}
