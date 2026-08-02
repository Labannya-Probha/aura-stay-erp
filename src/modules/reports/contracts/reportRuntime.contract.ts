export type ReportRuntimeError = {
  code: string
  message: string
  details?: unknown
}

export type ReportRuntimePayload = {
  rows: any[]
  summary: Record<string, any>
  comparisonRows: any[]
  comparisonSummary: {
    enabled: boolean
    compareTo: string
    currentPeriodLabel: string
    previousPeriodLabel: string
  }
  period?: Record<string, any>
  formatting?: Record<string, any>
  validation?: Record<string, any>
  mapping?: Record<string, any>
  approval?: Record<string, any>
  snapshot?: Record<string, any>
  versions?: any[]
  history?: any[]
  context?: Record<string, any>
  meta?: Record<string, any>
  generated_at?: string
  dataset_hash?: string
  freshness_label?: string
  engine?: string
  error?: ReportRuntimeError | null
  [key: string]: any
}

const EMPTY_COMPARISON = {
  enabled: false,
  compareTo: 'Off',
  currentPeriodLabel: 'Selected Period',
  previousPeriodLabel: '',
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function firstRecord(...values: unknown[]): Record<string, any> {
  return (values.find(isRecord) as Record<string, any>) || {}
}

function firstArray(...values: unknown[]): any[] {
  const found = values.find(Array.isArray)
  return Array.isArray(found) ? found : []
}

function normalizeRuntimeError(value: unknown): ReportRuntimeError | null {
  if (!value) return null
  if (typeof value === 'string') {
    return { code: 'REPORT_ENGINE_ERROR', message: value }
  }
  if (isRecord(value)) {
    return {
      code: String(value.code || 'REPORT_ENGINE_ERROR'),
      message: String(value.message || value.error || 'Report execution failed.'),
      details: value.details,
    }
  }
  return { code: 'REPORT_ENGINE_ERROR', message: 'Report execution failed.' }
}

/**
 * Converts current PostgreSQL payloads and future Python service payloads into
 * one stable UI contract. It never invents approvals, snapshots, hashes, or
 * validations. Missing governance metadata remains absent/unknown.
 */
export function normalizeReportRuntimePayload(
  raw: unknown,
  options: {
    compareTo?: string
    currentPeriodLabel?: string
    previousPeriodLabel?: string
  } = {},
): ReportRuntimePayload {
  const source = isRecord(raw) ? raw : {}
  const data = isRecord(source.data) ? source.data : source
  const summary = firstRecord(data.summary, source.summary)

  const rows = firstArray(data.rows, data.lines, source.rows)
  const comparisonRows = firstArray(
    data.comparisonRows,
    data.comparison_rows,
    source.comparisonRows,
  )

  const comparisonRaw = firstRecord(
    data.comparisonSummary,
    data.comparison_summary,
    source.comparisonSummary,
  )

  const generatedAt =
    data.generated_at ||
    data.generatedAt ||
    data.meta?.generated_at ||
    summary.generated_at ||
    summary.generatedAt

  const meta = {
    ...firstRecord(summary.meta, data.meta, source.meta),
    ...(generatedAt ? { generated_at: generatedAt } : {}),
    ...(summary.source_function && !data.meta?.engine ? { engine: summary.source_function } : {}),
  }

  const runtimeError = normalizeRuntimeError(
    data.error || source.error || summary.error || (source.ok === false ? source : null),
  )

  return {
    ...data,
    rows,
    summary,
    comparisonRows,
    comparisonSummary: {
      ...EMPTY_COMPARISON,
      ...comparisonRaw,
      enabled: Boolean(
        comparisonRaw.enabled ?? data.comparison_enabled ?? comparisonRows.length > 0,
      ),
      compareTo: String(
        comparisonRaw.compareTo || comparisonRaw.compare_to || options.compareTo || 'Off',
      ),
      currentPeriodLabel: String(
        comparisonRaw.currentPeriodLabel ||
          comparisonRaw.current_period_label ||
          options.currentPeriodLabel ||
          'Selected Period',
      ),
      previousPeriodLabel: String(
        comparisonRaw.previousPeriodLabel ||
          comparisonRaw.previous_period_label ||
          options.previousPeriodLabel ||
          '',
      ),
    },
    period: firstRecord(data.period, summary.period),
    formatting: firstRecord(data.formatting, summary.formatting),
    validation: firstRecord(data.validation, summary.validation),
    mapping: firstRecord(data.mapping, summary.mapping),
    approval: firstRecord(data.approval, summary.approval),
    snapshot: firstRecord(data.snapshot, summary.snapshot),
    versions: firstArray(data.versions, data.snapshot?.versions, summary.versions),
    history: firstArray(data.history, summary.history),
    context: firstRecord(data.context, summary.context),
    meta,
    generated_at: generatedAt,
    dataset_hash:
      data.dataset_hash || data.datasetHash || meta.dataset_hash || summary.dataset_hash,
    freshness_label:
      data.freshness_label ||
      data.freshnessLabel ||
      meta.freshness_label ||
      summary.freshness_label,
    engine: data.engine || meta.engine || summary.engine || summary.source_function,
    error: runtimeError,
  }
}

export function createEmptyReportRuntimePayload(): ReportRuntimePayload {
  return normalizeReportRuntimePayload({})
}
