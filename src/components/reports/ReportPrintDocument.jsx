import EnterpriseReportHeader from './EnterpriseReportHeader'
import EnterpriseReportFooter from './EnterpriseReportFooter'
import DynamicReportTable from './DynamicReportTable'

export default function ReportPrintDocument({ company, report, filters, rows, generatedBy }) {
  return (
    <div className="enterprise-print-doc">
      <EnterpriseReportHeader company={company} report={report} filters={filters} generatedBy={generatedBy} />
      <div className="erp-print-filter-summary">
        {Object.entries(filters).map(([key, value]) => (
          <span key={key}>{key}: <b>{value || 'All'}</b></span>
        ))}
      </div>
      <DynamicReportTable report={report} rows={rows} search="" pageSize={1000} />
      <EnterpriseReportFooter printedBy={generatedBy} />
    </div>
  )
}
