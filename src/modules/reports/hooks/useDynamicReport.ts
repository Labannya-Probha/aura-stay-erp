import { useCallback, useEffect, useRef, useState } from 'react'
import { loadReportDefinition, runMetadataReport } from '../sdk/reportMetadata.service'
import { getTenantId } from '../../../lib/tenant'
import { resolveCycleDateRange } from '../utils/resolveCycleDateRange'
import {
  createEmptyReportRuntimePayload,
  normalizeReportRuntimePayload,
  type ReportRuntimePayload,
} from '../contracts/reportRuntime.contract'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function monthStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function initialFilters() {
  return {
    cycle: 'Monthly',
    start_date: monthStart(),
    end_date: today(),
    compare_to: 'Previous Period',
  }
}

function toMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const record = error as Record<string, any>
    return String(record.message || record.details || record.error || 'Unable to run report.')
  }
  return 'Unable to run report.'
}

export function useDynamicReport(
  department = 'accounts',
  slug = 'accounts-payable-aging',
  role?: string,
) {
  const [definition, setDefinition] = useState<any>(null)
  const [data, setData] = useState<ReportRuntimePayload>(createEmptyReportRuntimePayload())
  const [filters, setFiltersState] = useState<Record<string, any>>(initialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const requestSequence = useRef(0)

  const setFilters = useCallback((next: any) => {
    setFiltersState((previous) => {
      const merged = typeof next === 'function' ? next(previous) : { ...previous, ...(next || {}) }

      const cycleChanged = merged.cycle !== previous.cycle
      if (cycleChanged && merged.cycle !== 'Custom Date Range') {
        const resolved = resolveCycleDateRange(merged.cycle)
        if (resolved) return { ...merged, ...resolved }
      }

      return merged
    })
  }, [])

  const refetch = useCallback(() => {
    setRefreshToken((value) => value + 1)
  }, [])

  useEffect(() => {
    setDefinition(null)
    setData(createEmptyReportRuntimePayload())
    setError(null)
    setFiltersState(initialFilters())
  }, [department, slug])

  useEffect(() => {
    const requestId = ++requestSequence.current
    let disposed = false

    const execute = async () => {
      setLoading(true)
      setError(null)

      try {
        const tenantId = getTenantId()
        const [nextDefinition, rawPayload] = await Promise.all([
          loadReportDefinition(department, slug, role),
          runMetadataReport(department, slug, filters, tenantId),
        ])

        if (disposed || requestId !== requestSequence.current) return

        const normalized = normalizeReportRuntimePayload(rawPayload, {
          compareTo: filters.compare_to,
          currentPeriodLabel:
            filters.start_date && filters.end_date
              ? `${filters.start_date} to ${filters.end_date}`
              : 'Selected Period',
        })

        setDefinition(nextDefinition)
        setData(normalized)

        if (normalized.error) {
          setError(normalized.error.message)
        }
      } catch (caught) {
        if (disposed || requestId !== requestSequence.current) return
        setData(createEmptyReportRuntimePayload())
        setError(toMessage(caught))
      } finally {
        if (!disposed && requestId === requestSequence.current) {
          setLoading(false)
        }
      }
    }

    void execute()

    return () => {
      disposed = true
    }
  }, [department, slug, role, filters, refreshToken])

  const configuredFilters = Array.isArray(definition?.filters) ? definition.filters : []

  const reportFilters = configuredFilters.some((filter: any) => filter.filterKey === 'compare_to')
    ? configuredFilters
    : [
        ...configuredFilters,
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
    error,
    refetch,
  }
}
