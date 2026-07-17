import { useEffect, useMemo, useState } from "react"
import { AedsDataGrid } from "../data-grid"
import { AedsFilterEngine } from "../filter-engine"
import AedsReportCatalog from "./AedsReportCatalog"
import AedsReportHeader from "./AedsReportHeader"
import AedsReportSavedViews from "./AedsReportSavedViews"
import {
  loadAedsReportCatalog,
  loadAedsReportDefinition,
  loadAedsReportViews,
  runAedsReport,
  saveAedsReportView,
} from "./reportEngine.service"
import { fieldsToDataGridColumns, filtersToFilterSchema } from "./reportEngineAdapters"
import "./aeds-report-engine.css"

export default function AedsReportEngine({
  role = "ADMIN",
  initialDepartment = "accounts",
  initialSlug = "ledger",
}) {
  const [groups, setGroups] = useState([])
  const [department, setDepartment] = useState(initialDepartment)
  const [slug, setSlug] = useState(initialSlug)
  const [definition, setDefinition] = useState(null)
  const [reportData, setReportData] = useState({ rows: [], summary: {} })
  const [filters, setFilters] = useState({ cycle: "this_month" })
  const [views, setViews] = useState([])
  const [loadingKey, setLoadingKey] = useState(0)

  useEffect(() => {
    loadAedsReportCatalog(role).then(setGroups)
  }, [role])

  useEffect(() => {
    loadAedsReportDefinition({ department, slug, role }).then(setDefinition)
    loadAedsReportViews(slug).then(setViews)
  }, [department, slug, role])

  useEffect(() => {
    runAedsReport({ department, slug, filters }).then(setReportData)
  }, [department, slug, filters, loadingKey])

  const columns = useMemo(
    () => fieldsToDataGridColumns(definition?.fields || []),
    [definition]
  )

  const filterSchema = useMemo(
    () => filtersToFilterSchema(definition?.filters || []),
    [definition]
  )

  const saveView = async () => {
    const name = window.prompt("Saved view name", "My Report View")
    if (!name) return
    const view = await saveAedsReportView({
      reportSlug: slug,
      name,
      filters,
      columns,
    })
    setViews((current) => [view, ...current])
  }

  const loadView = (view) => {
    setFilters(view.filters || {})
  }

  return (
    <section className="aeds-report-engine-page">
      <div className="aeds-report-engine-layout">
        <AedsReportCatalog
          groups={groups}
          active={`${department}/${slug}`}
          onSelect={(nextDepartment, nextSlug) => {
            setDepartment(nextDepartment)
            setSlug(nextSlug)
          }}
        />

        <main className="grid gap-4">
          <AedsReportHeader
            definition={definition}
            rows={reportData.rows || []}
            onRefresh={() => setLoadingKey((value) => value + 1)}
            onSaveView={saveView}
          />

          <AedsFilterEngine
            schema={filterSchema}
            initialValues={filters}
            onChange={setFilters}
            storageKey={`aeds.report.filters.${slug}`}
          />

          <AedsReportSavedViews views={views} onLoad={loadView} />

          <AedsDataGrid
            title={definition?.report?.title || "Report"}
            subtitle={definition?.report?.description || "Metadata-driven report"}
            data={reportData.rows || []}
            columns={columns}
          />
        </main>
      </div>
    </section>
  )
}
