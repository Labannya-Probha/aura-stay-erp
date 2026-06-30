import { useMemo, useState } from 'react'
import { Download, FileDown, Printer, RefreshCw, Search } from 'lucide-react'
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
  DASHBOARD_KPIS,
  getDefaultFilters,
  REPORT_CATEGORIES,
  REPORT_TEMPLATES,
  SAMPLE_KPI_VALUES,
  SAMPLE_ROWS,
} from '../lib/reporting/reportConfig'
import { exportReportCsv, exportReportExcel, exportReportPdf } from '../lib/reporting/reportExport'
import { todayISO } from '../lib/helpers'

const includesAll = (value) => !value || value.startsWith('All ')

function filterRows(rows, filters, report) {
  return rows.filter((row) => {
    if (filters.dateFrom && row.transactionDate < filters.dateFrom) return false
    if (filters.dateTo && row.transactionDate > filters.dateTo) return false
    if (!includesAll(filters.department) && row.department !== filters.department) return false
    if (!includesAll(filters.costCenter) && row.costCenter !== filters.costCenter) return false
    if (!includesAll(filters.roomType) && row.roomType !== filters.roomType) return false
    if (!includesAll(filters.paymentMethod) && row.paymentMethod !== filters.paymentMethod) return false
    if (!includesAll(filters.status) && row.status !== filters.status) return false
    if (report.category === 'POS' && !['Restaurant', 'F&B'].includes(row.department) && row.costCenter !== 'F&B') return false
    if (report.category === 'HOTEL_KPI' && !['Rooms', 'Housekeeping'].includes(row.department)) return false
    return true
  }).map((row, index) => ({ ...row, slNo: index + 1 }))
}

export default function Reports({ userName, company }) {
  const [activeCategory, setActiveCategory] = useState('IFRS')
  const [activeCode, setActiveCode] = useState('IFRS-PNL')
  const [filters, setFilters] = useState(() => getDefaultFilters(todayISO))
  const [search, setSearch] = useState('')
  const [printSize, setPrintSize] = useState('A4')
  const [printReport, setPrintReport] = useState(null)

  const activeReport = useMemo(
    () => REPORT_TEMPLATES.find((report) => report.code === activeCode) || REPORT_TEMPLATES[0],
    [activeCode]
  )
  const reportsByCategory = REPORT_TEMPLATES.filter((report) => activeCategory === 'ALL' || report.category === activeCategory)
  const rows = useMemo(() => filterRows(SAMPLE_ROWS, filters, activeReport), [activeReport, filters])
  const totals = useMemo(() => calculateTotals(activeReport.columns, rows), [activeReport, rows])
  const meta = {
    companyName: company?.software_name || company?.name || 'Aura Stay',
    propertyName: filters.property === 'All Properties' ? company?.name || 'All Properties' : filters.property,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    currency: filters.currency,
    generatedBy: userName,
  }

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const selectReport = (report) => {
    setActiveCategory(report.category)
    setActiveCode(report.code)
    setSearch('')
  }

  return (
    <div className="enterprise-reporting-module">
      {printReport && (
        <PrintPortal
          title={`${printReport.name} - ${printSize} landscape`}
          onClose={() => setPrintReport(null)}
          primaryColor="#0f3a5f"
          accentColor="#2563eb"
        >
          <div className={printSize === 'A3' ? 'print-a3-landscape' : 'print-a4-landscape'}>
            <ReportPrintDocument company={company} report={printReport} filters={filters} rows={rows} generatedBy={userName} />
          </div>
        </PrintPortal>
      )}

      <section className="erp-dashboard-top no-print">
        <div>
          <p className="erp-eyebrow">Enterprise Hotel ERP</p>
          <h1>Reporting Module</h1>
          <p>IFRS-ready management reports, hotel KPIs, POS analytics, exports, print control, and audit-ready configuration.</p>
        </div>
        <div className="erp-top-actions">
          <select className="input" value={printSize} onChange={(e) => setPrintSize(e.target.value)}>
            <option value="A4">A4 Landscape</option>
            <option value="A3">A3 Landscape</option>
          </select>
          <Button variant="outline" onClick={() => exportReportCsv(activeReport, rows, totals, meta)}>
            <Download size={15} /> CSV
          </Button>
          <Button variant="outline" onClick={() => exportReportPdf(activeReport, rows, totals, meta)}>
            <FileDown size={15} /> PDF
          </Button>
          <Button variant="outline" onClick={() => setPrintReport(activeReport)}>
            <Printer size={15} /> Print
          </Button>
          <Button onClick={() => exportReportExcel(activeReport, rows, totals, meta)}>
            <Download size={15} /> Excel
          </Button>
        </div>
      </section>

      <ReportKpiCards values={SAMPLE_KPI_VALUES} activeKeys={DASHBOARD_KPIS.map((kpi) => kpi.key)} />

      <section className="erp-workspace">
        <aside className="erp-report-sidebar no-print">
          <div className="erp-sidebar-search">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find reports" />
          </div>
          <button
            type="button"
            className={activeCategory === 'ALL' ? 'active' : ''}
            onClick={() => setActiveCategory('ALL')}
          >
            <span>All Reports</span>
            <Badge variant="outline">{REPORT_TEMPLATES.length}</Badge>
          </button>
          {REPORT_CATEGORIES.map((category) => {
            const Icon = category.icon
            const count = REPORT_TEMPLATES.filter((report) => report.category === category.code).length
            return (
              <button
                type="button"
                key={category.code}
                className={activeCategory === category.code ? 'active' : ''}
                onClick={() => setActiveCategory(category.code)}
              >
                <Icon size={16} />
                <span>{category.name}</span>
                <Badge variant="outline">{count}</Badge>
              </button>
            )
          })}
          <div className="erp-report-list">
            {reportsByCategory
              .filter((report) => !search || `${report.code} ${report.name} ${report.reportCategory}`.toLowerCase().includes(search.toLowerCase()))
              .map((report) => (
                <button
                  type="button"
                  key={report.code}
                  className={activeCode === report.code ? 'selected' : ''}
                  onClick={() => selectReport(report)}
                >
                  <strong>{report.code}</strong>
                  <span>{report.name}</span>
                </button>
              ))}
          </div>
        </aside>

        <main className="erp-report-canvas">
          <EnterpriseReportHeader company={company} report={activeReport} filters={filters} generatedBy={userName} />
          <ReportFilterPanel
            filters={filters}
            onChange={updateFilter}
            search={search}
            onSearchChange={setSearch}
            activeFilterKeys={activeReport.filters}
          />
          <section className="erp-report-config no-print">
            <div>
              <span>Data Source</span>
              <b>{activeReport.dataSource}</b>
            </div>
            <div>
              <span>Grouping</span>
              <b>{activeReport.grouping}</b>
            </div>
            <div>
              <span>Default Sort</span>
              <b>{activeReport.defaultSort.key} {activeReport.defaultSort.direction}</b>
            </div>
            <div>
              <span>Access</span>
              <b>Role-based export and print enabled</b>
            </div>
          </section>
          <DynamicReportTable report={activeReport} rows={rows} search={search} />
          <EnterpriseReportFooter printedBy={userName} />
        </main>
      </section>
    </div>
  )
}
