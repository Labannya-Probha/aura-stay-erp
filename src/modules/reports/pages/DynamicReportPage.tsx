import { Download, FileSpreadsheet, Printer } from "lucide-react"
import { useParams } from "react-router-dom"
import EnterpriseReportHeader from "../../../components/reports/EnterpriseReportHeader"
import MetadataReportFilters from "../components/MetadataReportFilters"
import MetadataReportTable from "../components/MetadataReportTable"
import { useDynamicReport } from "../hooks/useDynamicReport"
import { exportReportExcel, printReport } from "../utils/reportExport"

export default function DynamicReportPage({ role }) {
  const params = useParams()
  const department = params.department || "accounts"
  const slug = params.slug || "accounts-payable-aging"

  const { definition, data, filters, setFilters, loading } = useDynamicReport(department, slug, role)
  const report = definition?.report
  const fields = definition?.fields || []
  const printReportModel = {
    name: report?.title || "Report",
    reportCategory: definition?.department?.name || "Reports",
  }
  const printFilters = {
    dateFrom: filters?.start_date,
    dateTo: filters?.end_date,
    cycle: filters?.cycle,
    currency: "BDT",
  }

  return (
    <div>
      <main className="min-w-0 space-y-5 enterprise-print-doc">
        <section className="print-only">
          <EnterpriseReportHeader
            company={null}
            report={printReportModel}
            filters={printFilters}
            generatedBy={role}
          />
          <div className="erp-print-filter-summary">
            <span>Cycle: <b>{filters?.cycle || "Monthly"}</b></span>
            <span>Period: <b>{filters?.start_date || "-"} to {filters?.end_date || "-"}</b></span>
          </div>
        </section>

        <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm no-print">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F7F4EC] px-3 py-1 text-xs font-black text-[#1B4D2E]">
                  {definition?.department?.name || "Reports"}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {report?.title || "Report"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {report?.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={printReport} className="report-action-btn">
                <Printer size={16} />
                Print
              </button>
              <button type="button" onClick={printReport} className="report-action-btn">
                <Download size={16} />
                PDF
              </button>
              <button type="button" onClick={() => exportReportExcel(report, fields, data.rows)} className="report-primary-btn">
                <FileSpreadsheet size={16} />
                Excel
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm no-print">
          <MetadataReportFilters filters={definition?.filters || []} values={filters} onChange={setFilters} />
        </section>

        <MetadataReportTable fields={fields} rows={data.rows} loading={loading} />
      </main>
    </div>
  )
}
