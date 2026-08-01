import { useEffect, useMemo, useState } from 'react'
import { AedsDataGrid } from '../data-grid'
import { AedsFilterEngine } from '../filter-engine'
import AedsReportCatalog from './AedsReportCatalog'
import AedsReportHeader from './AedsReportHeader'
import AedsReportSavedViews from './AedsReportSavedViews'
import {
  enqueueAedsReportExport,
  waitForAedsReportExportJob,
  loadAedsReportCatalog,
  loadAedsReportDefinition,
  loadAedsReportViews,
  runAedsReport,
  saveAedsReportView,
} from './reportEngine.service'
import { fieldsToDataGridColumns, filtersToFilterSchema } from './reportEngineAdapters'
import './aeds-report-engine.css'
import FinancialStatementView from './FinancialStatementView'
import KpiGrid from './KpiGrid'
import './financial-statement.css'
import './kpi-grid.css'

function ReportErrorState({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="aeds-report-error" role="alert">
      <div>
        <strong>Report could not be loaded.</strong>
        <p>{error.message}</p>
      </div>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

export default function AedsReportEngine({
  role = 'ADMIN',
  initialDepartment = 'accounts',
  initialSlug = 'ledger',
}) {
  const [groups, setGroups] = useState([])
  const [department, setDepartment] = useState(initialDepartment)
  const [slug, setSlug] = useState(initialSlug)
  const [definition, setDefinition] = useState(null)
  const [reportData, setReportData] = useState({ rows: [], summary: {} })
  const [filters, setFilters] = useState({ cycle: 'this_month' })
  const [views, setViews] = useState([])
  const [loadingKey, setLoadingKey] = useState(0)
  const [exportBusy, setExportBusy] = useState('')
  const [catalogError, setCatalogError] = useState(null)
  const [definitionError, setDefinitionError] = useState(null)
  const [reportError, setReportError] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    let active = true
    setCatalogError(null)
    loadAedsReportCatalog(role)
      .then((data) => {
        if (active) setGroups(data)
      })
      .catch((error) => {
        if (active) setCatalogError(error)
      })
    return () => {
      active = false
    }
  }, [role, loadingKey])

  useEffect(() => {
    let active = true
    setDefinitionError(null)
    setDefinition(null)
    Promise.all([loadAedsReportDefinition({ department, slug, role }), loadAedsReportViews(slug)])
      .then(([nextDefinition, nextViews]) => {
        if (!active) return
        setDefinition(nextDefinition)
        setViews(nextViews)
      })
      .catch((error) => {
        if (active) setDefinitionError(error)
      })
    return () => {
      active = false
    }
  }, [department, slug, role, loadingKey])

  useEffect(() => {
    let active = true
    setReportLoading(true)
    setReportError(null)
    runAedsReport({ department, slug, filters })
      .then((data) => {
        if (!active) return
        setReportData(data)
      })
      .catch((error) => {
        if (!active) return
        setReportData({ rows: [], summary: {} })
        setReportError(error)
      })
      .finally(() => {
        if (active) setReportLoading(false)
      })
    return () => {
      active = false
    }
  }, [department, slug, filters, loadingKey])

  const columns = useMemo(() => fieldsToDataGridColumns(definition?.fields || []), [definition])
  const filterSchema = useMemo(() => filtersToFilterSchema(definition?.filters || []), [definition])

  const saveView = async () => {
    const name = window.prompt('Saved view name', 'My Report View')
    if (!name) return
    try {
      const view = await saveAedsReportView({ reportSlug: slug, name, filters, columns })
      setViews((current) => [view, ...current])
    } catch (error) {
      window.alert(error?.message || 'Unable to save this report view.')
    }
  }

  const loadView = (view) => setFilters(view.filters || {})

  const handleExport = async (format) => {
    const reportCode = definition?.report?.reportCode
    if (!reportCode) {
      window.alert('Missing report code for export.')
      return
    }

    try {
      setExportBusy(format)
      const job = await enqueueAedsReportExport({ reportCode, filters, format })
      const completed = await waitForAedsReportExportJob(job.jobId)
      const downloadUrl = completed?.result?.downloadUrl
      if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener,noreferrer')
      else window.alert('Export finished but download URL was not returned.')
    } catch (error) {
      window.alert(error?.message || 'Unable to export report right now.')
    } finally {
      setExportBusy('')
    }
  }

  const retry = () => setLoadingKey((value) => value + 1)

  return (
    <section className="aeds-report-engine-page">
      <ReportErrorState error={catalogError || definitionError} onRetry={retry} />
      <div className="aeds-report-engine-layout">
        <AedsReportCatalog
          groups={groups}
          active={`${department}/${slug}`}
          onSelect={(nextDepartment, nextSlug) => {
            setDepartment(nextDepartment)
            setSlug(nextSlug)
          }}
        />

        <main className="grid gap-4" aria-busy={reportLoading}>
          <AedsReportHeader
            definition={definition}
            rows={reportData.rows || []}
            onRefresh={retry}
            onSaveView={saveView}
            onExport={handleExport}
            exportBusy={exportBusy}
          />

          <AedsFilterEngine
            schema={filterSchema}
            initialValues={filters}
            onChange={setFilters}
            storageKey={`aeds.report.filters.${slug}`}
          />

          <AedsReportSavedViews views={views} onLoad={loadView} />
          <ReportErrorState error={reportError} onRetry={retry} />

          {reportLoading ? (
            <div className="aeds-report-loading">Generating report…</div>
          ) : definition?.report?.displayMode === 'financial_statement' ? (
            <FinancialStatementView
              title={definition?.report?.title}
              description={definition?.report?.description}
              rows={reportData.rows || []}
              summary={reportData.summary || {}}
              groupByField={definition?.report?.groupByField}
              summaryTotalKey={definition?.report?.summaryTotalKey}
            />
          ) : definition?.report?.displayMode === 'kpi_grid' ? (
            <KpiGrid
              title={definition?.report?.title}
              description={definition?.report?.description}
              rows={reportData.rows || []}
              summary={reportData.summary || {}}
            />
          ) : (
            <AedsDataGrid
              title={definition?.report?.title || 'Report'}
              subtitle={definition?.report?.description || 'Metadata-driven report'}
              data={reportData.rows || []}
              columns={columns}
            />
          )}
        </main>
      </div>
    </section>
  )
}
