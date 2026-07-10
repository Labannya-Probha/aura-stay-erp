import { useEffect, useState } from "react"
import { loadReportDefinition, runMetadataReport } from "../sdk/reportMetadata.service"

function today() {
  return new Date().toISOString().slice(0, 10)
}

function monthStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

export function useDynamicReport(department = "accounts", slug = "accounts-payable-aging", role) {
  const [definition, setDefinition] = useState(null)
  const [data, setData] = useState({ rows: [], summary: {} })
  const [filters, setFilters] = useState({ cycle: "Monthly", start_date: monthStart(), end_date: today() })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.resolve().then(async () => {
      setLoading(true)
      const def = await loadReportDefinition(department, slug, role)
      const rows = await runMetadataReport(department, slug, filters)
      if (!active) return
      setDefinition(def)
      setData(rows)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [department, slug, role, filters])

  return { definition, data, filters, setFilters, loading }
}
