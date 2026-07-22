import { Download, FileSpreadsheet, Printer, RefreshCcw, Save } from 'lucide-react'

export default function AedsReportActions({ onRefresh, onSaveView, onExport, exportBusy }) {
  const busy = Boolean(exportBusy)

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
      <button
        type="button"
        className="aeds-report-btn"
        onClick={() => onExport?.('pdf')}
        disabled={busy}
      >
        <Download size={16} />
        {exportBusy === 'pdf' ? 'PDF Queued...' : 'PDF'}
      </button>
      <button
        type="button"
        className="aeds-report-btn primary"
        onClick={() => onExport?.('excel')}
        disabled={busy}
      >
        <FileSpreadsheet size={16} />
        {exportBusy === 'excel' ? 'Excel Queued...' : 'Excel'}
      </button>
      <button
        type="button"
        className="aeds-report-btn"
        onClick={() => onExport?.('csv')}
        disabled={busy}
      >
        <Download size={16} />
        {exportBusy === 'csv' ? 'CSV Queued...' : 'CSV'}
      </button>
      <button type="button" className="aeds-report-btn" onClick={onSaveView}>
        <Save size={16} />
        Save View
      </button>
    </div>
  )
}
