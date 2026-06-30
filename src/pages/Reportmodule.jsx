import { useMemo, useState } from 'react'
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
  const [activeCode, setActiveCode] = useState('IFRS-PNL')
  const [filters, setFilters] = useState(() => getDefaultFilters(todayISO))
  const [search, setSearch] = useState('')
  const [printSize, setPrintSize] = useState('A4')
  const [printReport, setPrintReport] = useState(null)
  const [openCategories, setOpenCategories] = useState({ IFRS: true, HOTEL_KPI: false, POS: false, ACCOUNTING: false })

  const activeReport = useMemo(
    () => REPORT_TEMPLATES.find((report) => report.code === activeCode) || REPORT_TEMPLATES[0],
    [activeCode]
  )
  const activeKpiKeys = activeReport.kpis?.length ? activeReport.kpis : ['totalRevenue', 'roomRevenue', 'restaurantRevenue', 'outstandingReceivable']
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
    setActiveCode(report.code)
    setOpenCategories((current) => ({ ...current, [report.category]: true }))
  }
  const toggleCategory = (code) => setOpenCategories((current) => ({ ...current, [code]: !current[code] }))
  const filteredTemplates = REPORT_TEMPLATES.filter((report) =>
    !search || `${report.code} ${report.name} ${report.reportCategory}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="enterprise-reporting-module">
      {printReport && (
        <PrintPortal
          title={`${printReport.name} - ${printSize} landscape`}
          onClose={() => setPrintReport(null)}
          primaryColor="#0f3a5f"
          accentColor="#2563eb"
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
          <p>{activeReport.code} · {activeReport.name}</p>
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

      <section className="erp-workspace">
        <aside className="erp-report-sidebar no-print">
          <div className="erp-sidebar-title">
            <strong>Report Menu</strong>
            <span>{REPORT_TEMPLATES.length} reports</span>
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

        <main className="erp-report-canvas">
          <EnterpriseReportHeader company={company} report={activeReport} filters={filters} generatedBy={userName} />
          <ReportKpiCards values={SAMPLE_KPI_VALUES} activeKeys={activeKpiKeys} />
          <ReportFilterPanel
            filters={filters}
            onChange={updateFilter}
            search={search}
            onSearchChange={setSearch}
            activeFilterKeys={activeReport.filters}
          />
          <DynamicReportTable report={activeReport} rows={rows} search={search} />
          <EnterpriseReportFooter printedBy={userName} />
        </main>
      </section>
    </div>
  )
}
