import { CONFIDENTIAL_NOTE } from '../../lib/reporting/reportConfig'

export default function EnterpriseReportFooter({ printedBy, pageLabel = 'Page 1 of 1' }) {
  const printedAt = new Date().toLocaleString()
  return (
    <footer className="enterprise-report-footer">
      <div className="erp-signatures">
        <span>Prepared by</span>
        <span>Checked by</span>
        <span>Approved by</span>
        <span>Printed by: {printedBy || 'System'}</span>
      </div>
      <div className="erp-footer-meta">
        <span>Printed date/time: {printedAt}</span>
        <span>{pageLabel}</span>
      </div>
      <p>{CONFIDENTIAL_NOTE}</p>
    </footer>
  )
}
