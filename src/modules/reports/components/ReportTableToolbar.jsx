import { Download, FileSpreadsheet, FileText, Printer, Search } from "lucide-react"
import ReportColumnManager from "./ReportColumnManager"
import ReportGroupPanel from "./ReportGroupPanel"
import { exportRowsToCsv, exportRowsToExcel, printLandscapeReport } from "../utils/reportExportPro"
import { generateGenuineFinancialStatementPdf } from "../utils/genuinePdfExport"
import { Button } from "src/components/ui/button"
import { getCompany } from "src/lib/pms.api"

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
  const exportGenuinePdf = async () => {
    let company = null
    try {
      const result = await getCompany()
      company = result?.data || null
    } catch {
      // Branding is a nice-to-have — a failed lookup must not block the
      // export itself, just fall back to a text-only header.
    }
    const doc = await generateGenuineFinancialStatementPdf({
      title: report?.title || "Financial Statement",
      periodLabel: "",
      rows: rows || [],
      meta: {
        tenantName: company?.name || "",
        logoUrl: company?.logo_url || null,
      },
    })
    doc.save(`${report?.slug || "report"}.pdf`)
  }

  return (
    <div className="aeds-report-toolbar">
      <div className="aeds-report-search">
        <Search size={16} />
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search inside report..." />
      </div>

      <ReportGroupPanel fields={fields} groupKey={groupKey} setGroupKey={setGroupKey} />

      <ReportColumnManager fields={fields} visibleKeys={visibleKeys} setVisibleKeys={setVisibleKeys} />

      <Button variant="outline" onClick={printLandscapeReport}>
        <Printer size={16} /> Print
      </Button>

      <Button variant="outline" onClick={() => exportRowsToCsv({ report, fields, rows })}>
        <Download size={16} /> CSV
      </Button>

      {/* Phase 7 (genuine PDF) — additive alternative to the existing
          html2canvas-based Print/Export flow, which is unchanged above.
          Produces a true vector/text PDF via jsPDF + autoTable. */}
      <Button variant="outline" onClick={exportGenuinePdf}>
        <FileText size={16} /> Genuine PDF
      </Button>

      <Button variant="default" onClick={() => exportRowsToExcel({ report, fields, rows })}>
        <FileSpreadsheet size={16} /> Excel
      </Button>
    </div>
  )
}
