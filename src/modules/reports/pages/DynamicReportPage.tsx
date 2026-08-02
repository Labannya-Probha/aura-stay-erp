import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Play,
  Printer,
  RotateCcw,
} from 'lucide-react'
import { useParams } from 'react-router-dom'
import {
  enqueueAedsReportExport,
  waitForAedsReportExportJob,
} from '../../../components/report-engine/reportEngine.service'
import ReportingStudioShell from '../components/ReportingStudioShell'
import ReportViewManager from '../components/ReportViewManager'
import ReportGovernanceBar from '../components/ReportGovernanceBar'
import ReportHealthPanel, { type ReportHealthCheck } from '../components/ReportHealthPanel'
import ReportProvenanceBar from '../components/ReportProvenanceBar'
import MetadataReportFilters from '../components/MetadataReportFilters'
import MetadataReportTable from '../components/MetadataReportTable'
import ReportRenderer from '../renderers/ReportRenderer'
import ReportPrintPreview, { buildReportPrintPreviewModel } from '../components/ReportPrintPreview'
import { useDynamicReport } from '../hooks/useDynamicReport'
import { useReportKeyboardShortcuts } from '../hooks/useReportKeyboardShortcuts'
import { exportReportExcel } from '../utils/reportExport'
import KpiGrid from '../../../components/report-engine/KpiGrid'

const FINANCIAL_STATEMENT_SLUGS = new Set([
  'profit-and-loss-statement',
  'balance-sheet',
  'cash-flow-statement',
  'statement-of-changes-in-equity',
  'changes-in-equity',
  'usali-departmental-statement',
])

function compactContextItem(label: string, value: unknown) {
  if (value == null || value === '') return null
  return (
    <span className="report-context-item">
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </span>
  )
}

function deriveHealthChecks(data: any, report: any): ReportHealthCheck[] {
  const validation = data?.validation || data?.summary?.validation || {}
  const mapping = data?.mapping || data?.summary?.mapping || {}
  const snapshot = data?.snapshot || data?.summary?.snapshot || {}
  const approval = data?.approval || data?.summary?.approval || {}

  return [
    {
      key: 'dataset',
      label: 'Dataset validation',
      status:
        validation?.valid === false ? 'failed' : validation?.valid === true ? 'passed' : 'unknown',
      detail:
        validation?.valid === false
          ? validation?.errors?.[0]?.message || 'Dataset validation failed'
          : validation?.valid === true
            ? 'Validated by reporting service'
            : 'Validation result not supplied',
    },
    {
      key: 'balance',
      label: 'Ledger reconciliation',
      status:
        validation?.balanced === false
          ? 'failed'
          : validation?.balanced === true
            ? 'passed'
            : 'unknown',
      detail:
        validation?.balanced === false
          ? 'Statement is out of balance'
          : validation?.balanced === true
            ? 'Statement balances reconcile'
            : 'Balance control not supplied',
    },
    {
      key: 'mapping',
      label: 'Mapping completeness',
      status:
        mapping?.complete === false ? 'warning' : mapping?.complete === true ? 'passed' : 'unknown',
      detail:
        mapping?.unmappedCount > 0
          ? `${mapping.unmappedCount} unmapped account(s)`
          : mapping?.complete === true
            ? 'All required mappings resolved'
            : 'Mapping status not supplied',
    },
    {
      key: 'approval',
      label: 'Approval control',
      status: /approved|posted|locked/i.test(approval?.status || report?.status || '')
        ? 'passed'
        : /rejected|failed/i.test(approval?.status || report?.status || '')
          ? 'failed'
          : approval?.status
            ? 'warning'
            : 'unknown',
      detail: approval?.status || report?.status || 'Approval status not supplied',
    },
    {
      key: 'snapshot',
      label: 'Snapshot integrity',
      status: snapshot?.hash || snapshot?.id ? 'passed' : 'unknown',
      detail:
        snapshot?.hash || snapshot?.id ? 'Immutable snapshot available' : 'No snapshot supplied',
    },
  ]
}

export default function DynamicReportPage({ role, company, userName }) {
  const params = useParams()
  const department = params.department || 'accounts'
  const slug = params.slug || 'accounts-payable-aging'
  const [pdfBusy, setPdfBusy] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const filterRegionRef = useRef<HTMLDivElement | null>(null)

  const { definition, data, filters, reportFilters, setFilters, loading, error, refetch } =
    useDynamicReport(department, slug, role)
  const [draftFilters, setDraftFilters] = useState(filters || {})

  useEffect(() => {
    setDraftFilters(filters || {})
  }, [department, slug])

  useEffect(() => {
    if (!fullscreen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [fullscreen])

  const report = definition?.report || {}
  const fields = definition?.fields || []
  const rows = Array.isArray(data?.rows) ? data.rows : []

  const rendererKey = String(
    report?.renderer ||
      report?.displayMode ||
      definition?.renderer ||
      definition?.displayMode ||
      '',
  ).toLowerCase()
  const isFinancialStatement =
    FINANCIAL_STATEMENT_SLUGS.has(slug) || rendererKey.includes('financial_statement')
  const showHeadlineKpis = Boolean(report?.showHeadlineKpis) && !isFinancialStatement

  const printPreviewModel = buildReportPrintPreviewModel({
    definition,
    data,
    filters,
    company,
    role,
    userName,
  })

  const headlineKpis = useMemo(
    () =>
      [
        { metric: 'revenue', value: data?.summary?.revenue ?? data?.summary?.current_revenue },
        {
          metric: 'net_profit',
          value: data?.summary?.net_profit ?? data?.summary?.current_net_profit,
        },
        {
          metric: 'gross_margin_pct',
          value: data?.summary?.gross_margin_pct ?? data?.summary?.gross_margin,
        },
        { metric: 'occupancy_rate', value: data?.summary?.occupancy_rate },
      ].filter((metric) => metric.value != null && metric.value !== ''),
    [data?.summary],
  )

  const periodLabel =
    data?.period?.label ||
    data?.summary?.period?.label ||
    data?.summary?.period_label ||
    filters?.period ||
    filters?.cycle

  const reportStatus =
    data?.approval?.status ||
    data?.snapshot?.status ||
    report?.status ||
    (loading ? 'Running' : 'Generated')

  const reportVersions = data?.versions || data?.snapshot?.versions || data?.summary?.versions || []

  const approvalSteps = data?.approval?.steps || data?.summary?.approval?.steps || []

  const healthChecks = useMemo(() => deriveHealthChecks(data, report), [data, report])

  const summaryStrip = (
    <div className="report-context-strip">
      {compactContextItem('Company', company?.name || 'Aura Stay ERP')}
      {compactContextItem('Business unit', data?.context?.businessUnit || filters?.business_unit)}
      {compactContextItem('Period', periodLabel)}
      {compactContextItem(
        'Comparison',
        data?.comparisonSummary?.enabled ? data.comparisonSummary.compareTo : 'Off',
      )}
      {compactContextItem(
        'Currency',
        data?.formatting?.reporting_currency || data?.summary?.currency,
      )}
      {compactContextItem('Rows', rows.length)}
    </div>
  )

  const resetCriteria = useCallback(() => setDraftFilters(filters || {}), [filters])
  const runReport = useCallback(() => setFilters(draftFilters), [draftFilters, setFilters])
  const printReport = useCallback(() => window.print(), [])
  const exportExcel = useCallback(
    () => exportReportExcel(report, fields, rows),
    [report, fields, rows],
  )
  const focusFilters = useCallback(() => {
    const target = filterRegionRef.current?.querySelector<HTMLElement>(
      'input, select, button, [tabindex]:not([tabindex="-1"])',
    )
    target?.focus()
  }, [])
  const toggleFullscreen = useCallback(() => setFullscreen((current) => !current), [])

  useReportKeyboardShortcuts({
    onRun: runReport,
    onPrint: printReport,
    onExcel: exportExcel,
    onFilterFocus: focusFilters,
    onFullscreen: toggleFullscreen,
  })

  const handlePdfExport = async () => {
    const reportCode = report?.reportCode || report?.report_code
    if (!reportCode) {
      window.alert('Missing report code for PDF export.')
      return
    }

    try {
      setPdfBusy(true)
      const job = await enqueueAedsReportExport({ reportCode, filters, format: 'pdf' })
      const completed = await waitForAedsReportExportJob(job.jobId)
      const downloadUrl = completed?.result?.downloadUrl
      if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener,noreferrer')
      else window.alert('PDF export finished but no download URL was returned.')
    } catch (error) {
      window.alert(error?.message || 'Unable to export PDF right now.')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className={fullscreen ? 'report-workspace-fullscreen' : undefined}>
      <ReportingStudioShell
        title={report?.title || 'Report'}
        subtitle={report?.description}
        eyebrow={definition?.department?.name || 'Reports'}
        breadcrumbs={
          <span>
            Reports <span className="px-1 text-slate-300">/</span>{' '}
            {definition?.department?.name || 'General'}
          </span>
        }
        summary={summaryStrip}
        filterCount={reportFilters.length}
        actions={
          <>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="report-action-btn"
              title="Shortcut: Alt+F"
            >
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {fullscreen ? 'Exit' : 'Fullscreen'}
            </button>
            <button
              type="button"
              onClick={printReport}
              className="report-action-btn"
              title="Shortcut: Ctrl+P"
            >
              <Printer size={15} />
              Print
            </button>
            <button
              type="button"
              onClick={handlePdfExport}
              className="report-action-btn"
              disabled={pdfBusy}
            >
              <Download size={15} />
              {pdfBusy ? 'Preparing…' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="report-primary-btn"
              title="Shortcut: Ctrl+E"
            >
              <FileSpreadsheet size={15} />
              Excel
            </button>
          </>
        }
        filters={
          <div className="space-y-3" ref={filterRegionRef}>
            <MetadataReportFilters
              filters={reportFilters}
              values={draftFilters}
              onChange={setDraftFilters}
            />
            <div className="report-criteria-actions">
              <ReportViewManager
                storageKey={`aeds:report-views:${report?.reportCode || report?.report_code || slug}`}
                currentFilters={draftFilters}
                onApply={setDraftFilters}
              />
              <div className="flex items-center gap-2">
                <button type="button" onClick={resetCriteria} className="report-action-btn">
                  <RotateCcw size={15} />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={runReport}
                  className="report-run-btn"
                  title="Shortcut: Alt+R"
                >
                  <Play size={15} />
                  Run report
                </button>
              </div>
            </div>
          </div>
        }
        loading={!definition && loading}
        empty={!loading && !error && rows.length === 0}
        error={error}
        onRefresh={refetch}
        refreshing={loading}
      >
        <ReportGovernanceBar
          status={reportStatus}
          approvalSteps={approvalSteps}
          versions={reportVersions}
          activeVersion={data?.snapshot?.version || data?.version}
          snapshotId={data?.snapshot?.id || data?.snapshot?.version}
          locked={Boolean(data?.snapshot?.locked || /locked/i.test(reportStatus))}
          onOpenHistory={() => setHistoryOpen((open) => !open)}
          onVersionChange={(version) => {
            const versionId = version?.id || version?.version
            if (versionId != null) {
              setFilters({ ...filters, report_version: versionId })
            }
          }}
        />

        {historyOpen ? (
          <section className="report-history-panel no-print">
            <header>
              <div>
                <strong>Version and approval history</strong>
                <span>Server-returned report history only</span>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)}>
                Close
              </button>
            </header>
            {Array.isArray(data?.history) && data.history.length ? (
              <ol>
                {data.history.map((entry: any, index: number) => (
                  <li key={entry.id || index}>
                    <span>{entry.action || entry.status || 'Report event'}</span>
                    <strong>{entry.actor_name || entry.actor || 'System'}</strong>
                    <small>{entry.created_at || entry.timestamp || ''}</small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No report history was returned by the reporting service.</p>
            )}
          </section>
        ) : null}

        <div className="report-workspace-meta-grid no-print">
          <ReportHealthPanel checks={healthChecks} />
          <section className="report-shortcuts-card">
            <strong>Keyboard shortcuts</strong>
            <div>
              <span>
                <kbd>Alt</kbd> + <kbd>R</kbd> Run
              </span>
              <span>
                <kbd>Ctrl</kbd> + <kbd>P</kbd> Print
              </span>
              <span>
                <kbd>Ctrl</kbd> + <kbd>E</kbd> Excel
              </span>
              <span>
                <kbd>Ctrl</kbd> + <kbd>/</kbd> Filters
              </span>
              <span>
                <kbd>Alt</kbd> + <kbd>F</kbd> Fullscreen
              </span>
            </div>
          </section>
        </div>

        <main className="erp-print-doc erp-report-body min-w-0 enterprise-print-doc">
          <section className="screen-only space-y-3">
            {showHeadlineKpis && headlineKpis.length > 0 ? (
              <KpiGrid
                title="Report summary"
                description="Key measures for the selected criteria"
                rows={headlineKpis}
                summary={data.summary || {}}
              />
            ) : null}

            <div
              className="report-document-canvas"
              data-report-status={String(reportStatus).toLowerCase()}
            >
              {/draft|working/i.test(reportStatus) ? (
                <div className="report-document-watermark" aria-hidden="true">
                  DRAFT
                </div>
              ) : /approved/i.test(reportStatus) ? (
                <div
                  className="report-document-watermark report-document-watermark--approved"
                  aria-hidden="true"
                >
                  APPROVED
                </div>
              ) : /locked/i.test(reportStatus) ? (
                <div
                  className="report-document-watermark report-document-watermark--locked"
                  aria-hidden="true"
                >
                  LOCKED
                </div>
              ) : null}

              <ReportRenderer
                definition={definition}
                slug={slug}
                data={data}
                loading={loading}
                fallback={
                  <MetadataReportTable
                    fields={fields}
                    rows={rows}
                    comparisonRows={data?.comparisonRows || []}
                    comparisonSummary={data?.comparisonSummary || { enabled: false }}
                    loading={loading}
                  />
                }
              />
            </div>
          </section>

          <section className="print-only">
            <ReportPrintPreview model={printPreviewModel} company={company} />
          </section>
        </main>

        <ReportProvenanceBar
          generatedAt={
            data?.generated_at || data?.meta?.generated_at || data?.snapshot?.generated_at
          }
          engine={data?.meta?.engine || data?.engine || 'Python reporting service'}
          datasetHash={
            data?.dataset_hash || data?.meta?.dataset_hash || data?.snapshot?.dataset_hash
          }
          snapshotVersion={data?.snapshot?.version || data?.version}
          approvedBy={data?.approval?.approved_by_name || data?.snapshot?.approved_by_name}
          executionMs={data?.meta?.execution_ms || data?.execution_ms}
          freshnessLabel={data?.meta?.freshness_label || data?.freshness_label}
        />
      </ReportingStudioShell>
    </div>
  )
}
