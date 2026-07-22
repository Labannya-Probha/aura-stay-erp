import AedsReportActions from './AedsReportActions'

export default function AedsReportHeader({
  definition,
  rows,
  onRefresh,
  onSaveView,
  onExport,
  exportBusy,
}) {
  const report = definition?.report
  const department = definition?.department

  return (
    <header className="aeds-report-header">
      <div>
        <span className="aeds-report-badge">{department?.name || 'Reports'}</span>
        <h1>{report?.title || 'Report'}</h1>
        <p>{report?.description || 'Metadata-driven enterprise report.'}</p>
      </div>

      <AedsReportActions
        report={report}
        rows={rows}
        onRefresh={onRefresh}
        onSaveView={onSaveView}
        onExport={onExport}
        exportBusy={exportBusy}
      />
    </header>
  )
}
