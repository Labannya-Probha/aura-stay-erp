import { useState } from 'react'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { useParams } from 'react-router-dom'
import {
  enqueueAedsReportExport,
  waitForAedsReportExportJob,
} from '../../../components/report-engine/reportEngine.service'
import ReportingStudioShell from '../components/ReportingStudioShell'
import MetadataReportFilters from '../components/MetadataReportFilters'
import MetadataReportTable from '../components/MetadataReportTable'
import ReportRenderer from '../renderers/ReportRenderer'
import ReportPrintPreview, {
  buildReportPrintPreviewModel,
} from '../components/ReportPrintPreview'
import { useDynamicReport } from '../hooks/useDynamicReport'
import { exportReportExcel } from '../utils/reportExport'
import KpiGrid from '../../../components/report-engine/KpiGrid'

export default function DynamicReportPage({ role, company, userName }) {
  const params = useParams()
  const department = params.department || 'accounts'
  const slug = params.slug || 'accounts-payable-aging'
  const [pdfBusy, setPdfBusy] = useState(false)

  const { definition, data, filters, reportFilters, setFilters, loading } = useDynamicReport(
    department,
    slug,
    role,
  )
  const report = definition?.report
  const fields = definition?.fields || []
  const printPreviewModel = buildReportPrintPreviewModel({
    definition,
    data,
    filters,
    company,
    role,
    userName,
  })

  const headlineKpis = [
    { metric: 'revenue', value: data?.summary?.revenue ?? data?.summary?.current_revenue },
    { metric: 'net_profit', value: data?.summary?.net_profit ?? data?.summary?.current_net_profit },
    {
      metric: 'gross_margin_pct',
      value: data?.summary?.gross_margin_pct ?? data?.summary?.gross_margin,
    },
    { metric: 'occupancy_rate', value: data?.summary?.occupancy_rate },
  ].filter((metric) => metric.value != null && metric.value !== '')

  const summaryStrip = (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
      <span className="rounded-full bg-[#F7F4EC] px-3 py-1 text-[#1B4D2E]">
        {definition?.department?.name || 'Reports'}
      </span>
      <span className="rounded-full bg-slate-50 px-3 py-1">{data.rows.length} rows</span>
      <span className="rounded-full bg-slate-50 px-3 py-1">
        {data.comparisonSummary?.enabled
          ? `Compare: ${data.comparisonSummary.compareTo}`
          : 'Comparison off'}
      </span>
    </div>
  )

  const handlePdfExport = async () => {
    const reportCode = report?.reportCode
    if (!reportCode) {
      window.alert('Missing report code for PDF export.')
      return
    }

    try {
      setPdfBusy(true)
      const job = await enqueueAedsReportExport({
        reportCode,
        filters,
        format: 'pdf',
      })
      const completed = await waitForAedsReportExportJob(job.jobId)
      const downloadUrl = completed?.result?.downloadUrl
      if (downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer')
      } else {
        window.alert('PDF export finished but no download URL was returned.')
      }
    } catch (error) {
      window.alert(error?.message || 'Unable to export PDF right now.')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <ReportingStudioShell
      title={report?.title || 'Report'}
      subtitle={report?.description}
      eyebrow={definition?.department?.name || 'Reports'}
      summary={summaryStrip}
      actions={
        <>
          <button
            type="button"
            onClick={() => window.print()}
            className="report-action-btn"
            title="Print current page layout in browser"
          >
            <Printer size={16} />
            Print View
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="report-action-btn"
            disabled={pdfBusy}
            title="Generate PDF from server export queue"
          >
            <Download size={16} />
            {pdfBusy ? 'Exporting PDF...' : 'Export PDF'}
          </button>
          <button
            type="button"
            onClick={() => exportReportExcel(report, fields, data.rows)}
            className="report-primary-btn"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
        </>
      }
      filters={
        <MetadataReportFilters filters={reportFilters} values={filters} onChange={setFilters} />
      }
      loading={false}
      empty={false}
    >
      <main className="erp-print-doc erp-report-body min-w-0 space-y-5 enterprise-print-doc">
        <section className="screen-only space-y-5">
          {headlineKpis.length > 0 && (
            <KpiGrid
              title="Statement Summary"
              description="Headline operating metrics for the current selection"
              rows={headlineKpis}
              summary={data.summary || {}}
            />
          )}

          <ReportRenderer
            definition={definition}
            slug={slug}
            data={data}
            loading={loading}
            fallback={
              <MetadataReportTable
                fields={fields}
                rows={data.rows}
                comparisonRows={data.comparisonRows || []}
                comparisonSummary={data.comparisonSummary || { enabled: false }}
                loading={loading}
              />
            }
          />
        </section>

        <section className="print-only">
          <ReportPrintPreview model={printPreviewModel} company={company} />
        </section>
      </main>
    </ReportingStudioShell>
  )
}
