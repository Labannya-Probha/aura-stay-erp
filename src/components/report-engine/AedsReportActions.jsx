import { Download, FileSpreadsheet, Printer, RefreshCcw, Save } from "lucide-react"

export default function AedsReportActions({ onRefresh, onSaveView }) {
  return (
    <div className="aeds-report-actions">
      <button type="button" className="aeds-report-btn" onClick={onRefresh}>
        <RefreshCcw size={16} />
        Refresh
      </button>
      <button type="button" className="aeds-report-btn" onClick={() => window.print()}>
        <Printer size={16} />
        Print
      </button>
      <button type="button" className="aeds-report-btn">
        <Download size={16} />
        PDF
      </button>
      <button type="button" className="aeds-report-btn primary">
        <FileSpreadsheet size={16} />
        Excel
      </button>
      <button type="button" className="aeds-report-btn" onClick={onSaveView}>
        <Save size={16} />
        Save View
      </button>
    </div>
  )
}
