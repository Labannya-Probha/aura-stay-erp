import { Download, FileSpreadsheet, Printer, Search } from "lucide-react"
import ReportColumnManager from "./ReportColumnManager"
import ReportGroupPanel from "./ReportGroupPanel"
import { exportRowsToCsv, exportRowsToExcel, printLandscapeReport } from "../utils/reportExportPro"

export default function ReportTableToolbar({
  report,
  fields,
  rows,
  visibleKeys,
  setVisibleKeys,
  searchTerm,
  setSearchTerm,
  groupKey,
  setGroupKey,
}) {
  return (
    <div className="aeds-report-toolbar">
      <div className="aeds-report-search">
        <Search size={16} />
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search inside report..." />
      </div>

      <ReportGroupPanel fields={fields} groupKey={groupKey} setGroupKey={setGroupKey} />

      <ReportColumnManager fields={fields} visibleKeys={visibleKeys} setVisibleKeys={setVisibleKeys} />

      <button type="button" className="aeds-toolbar-btn" onClick={printLandscapeReport}>
        <Printer size={16} /> Print
      </button>

      <button type="button" className="aeds-toolbar-btn" onClick={() => exportRowsToCsv({ report, fields, rows })}>
        <Download size={16} /> CSV
      </button>

      <button type="button" className="aeds-toolbar-primary" onClick={() => exportRowsToExcel({ report, fields, rows })}>
        <FileSpreadsheet size={16} /> Excel
      </button>
    </div>
  )
}
