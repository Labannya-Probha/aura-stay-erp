import { useEffect, useState, useCallback } from 'react'
import { loadReportDefinition, runMetadataReport } from '../sdk/reportMetadata.service'
import { getTenantId } from '../../../lib/tenant'
import { resolveCycleDateRange } from '../utils/resolveCycleDateRange'

const EMPTY_REPORT_DATA = {
  rows: [],
  summary: {},
  comparisonRows: [],
  comparisonSummary: { enabled: false },
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function monthStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

export function useDynamicReport(department = 'accounts', slug = 'accounts-payable-aging', role) {
  const [definition, setDefinition] = useState(null)
  const [data, setData] = useState(EMPTY_REPORT_DATA)
  const [filters, setFiltersState] = useState({
    cycle: 'Monthly',
    start_date: monthStart(),
    end_date: today(),
    compare_to: 'Previous Period',
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * Wraps the raw setFilters so that whenever `cycle` changes to anything
   * other than "Custom Date Range", start_date/end_date are recalculated
   * from that cycle via resolveCycleDateRange — this is the fix that makes
   * the Cycle dropdown actually change what data gets queried, not just
   * what text it displays.
   */
  const setFilters = useCallback((next) => {
    setFiltersState((prev) => {
      const merged = typeof next === 'function' ? next(prev) : { ...prev, ...next }
      const cycleChanged = merged.cycle !== prev.cycle

      if (cycleChanged && merged.cycle !== 'Custom Date Range') {
        const resolved = resolveCycleDateRange(merged.cycle)
        if (resolved) {
          return { ...merged, ...resolved }
        }
      }
      return merged
    })
  }, [])

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1)
  }, [])

  useEffect(() => {
    let active = true
    Promise.resolve().then(async () => {
      let nextDefinition = null
      setLoading(true)
      setRefreshing(refreshKey > 0)
      setError(null)
      try {
        const tenantId = getTenantId()
        nextDefinition = await loadReportDefinition(department, slug, role)
        const rows = await runMetadataReport(department, slug, filters, tenantId)
        if (!active) return
        setDefinition(nextDefinition)
        setData(rows)
      } catch (loadError) {
        if (!active) return
        setDefinition(nextDefinition)
        setData(EMPTY_REPORT_DATA)
        setError(loadError instanceof Error ? loadError.message : 'Unable to load report.')
      } finally {
        if (!active) return
        setLoading(false)
        setRefreshing(false)
      }
    })

    return () => {
      active = false
    }
  }, [department, slug, role, filters, refreshKey])

  const reportFilters = definition?.filters?.some((filter) => filter.filterKey === 'compare_to')
    ? definition.filters
    : [
        ...(definition?.filters || []),
        {
          filterKey: 'compare_to',
          label: 'Compare To',
          filterType: 'Dropdown',
          sourceOptions: 'Off,Previous Period,Previous Month,Previous Quarter,Previous Year',
          defaultValue: 'Previous Period',
        },
      ]

  return {
    definition,
    data,
    filters,
    reportFilters,
    setFilters,
    loading,
    refreshing,
    error,
    refresh,
  }
}
