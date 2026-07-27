import { useMemo } from 'react'

export type ComparativeSeriesFormat = 'currency' | 'percent' | 'number'

export type ComparativeMetricInput = {
  label: string
  current: number | string | null | undefined
  series?: Array<number | Record<string, unknown> | null | undefined>
  seriesKeys?: string[]
  format?: ComparativeSeriesFormat
  precision?: number
  tone?: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'
}

export type ComparativeMetricOutput = {
  label: string
  current: number
  previous: number
  delta: number
  deltaPercent: number | null
  trend: 'up' | 'down' | 'flat'
  tone: NonNullable<ComparativeMetricInput['tone']>
  format: ComparativeSeriesFormat
  precision: number
  valueLabel: string
  deltaLabel: string
  sparkline: number[]
}

const DEFAULT_SERIES_KEYS = [
  'value',
  'total',
  'amount',
  'occupancy',
  'adr',
  'revpar',
  'gop',
  'roomRevenue',
]

function toNumber(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveSeriesValue(point: unknown, seriesKeys: string[] = DEFAULT_SERIES_KEYS) {
  if (typeof point === 'number') return point
  if (!point || typeof point !== 'object') return 0

  const row = point as Record<string, unknown>
  if (seriesKeys.length === 1) {
    return toNumber(row[seriesKeys[0]])
  }

  const extracted = seriesKeys
    .map((key) => toNumber(row[key]))
    .filter((value) => Number.isFinite(value))

  if (extracted.length > 0) {
    return extracted.reduce((sum, value) => sum + value, 0)
  }

  for (const key of DEFAULT_SERIES_KEYS) {
    const candidate = toNumber(row[key])
    if (candidate !== 0) return candidate
  }

  return toNumber(row.current ?? row.previous ?? row.delta ?? row.change)
}

function buildSparkline(values: number[]) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min || 1
  return values.map((value) => ((value - min) / spread) * 100)
}

function formatValue(value: number, format: ComparativeSeriesFormat, precision: number) {
  if (format === 'percent') {
    return `${value.toFixed(precision)}%`
  }

  if (format === 'currency') {
    return `৳${value.toLocaleString('en-BD', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })}`
  }

  return value.toLocaleString('en-BD', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

export function useComparativeSeries(metrics: ComparativeMetricInput[]) {
  return useMemo<ComparativeMetricOutput[]>(() => {
    return metrics.map((metric) => {
      const seriesValues = (metric.series || []).map((point) =>
        resolveSeriesValue(point, metric.seriesKeys || DEFAULT_SERIES_KEYS),
      )
      const current = toNumber(metric.current)
      const previous =
        seriesValues.length > 1
          ? seriesValues[seriesValues.length - 2]
          : (seriesValues[0] ?? current)
      const delta = current - previous
      const deltaPercent = previous !== 0 ? (delta / Math.abs(previous)) * 100 : null
      const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
      const precision = metric.precision ?? (metric.format === 'percent' ? 1 : 0)
      const sparkline = buildSparkline(seriesValues.length > 0 ? seriesValues : [current])

      return {
        label: metric.label,
        current,
        previous,
        delta,
        deltaPercent,
        trend,
        tone: metric.tone || 'slate',
        format: metric.format || 'number',
        precision,
        valueLabel: formatValue(current, metric.format || 'number', precision),
        deltaLabel:
          deltaPercent === null
            ? `${delta >= 0 ? '+' : ''}${formatValue(delta, metric.format || 'number', precision)}`
            : `${delta >= 0 ? '+' : ''}${delta.toFixed(precision)} (${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(precision)}%)`,
        sparkline,
      }
    })
  }, [metrics])
}
