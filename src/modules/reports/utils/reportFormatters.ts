/**
 * Formats a report cell value according to its registered data_type AND
 * display_format string (e.g. "DD-MMM-YYYY", "#,##0", "#,##0.00", "0.0%").
 */
export function formatReportCell(value, dataType, displayFormat) {
  if (value === null || value === undefined || value === '') return '-'

  if (dataType === 'Date') {
    return formatReportDate(value, displayFormat)
  }

  if (dataType?.includes('Currency')) {
    return `৳${formatReportNumber(value, displayFormat || '#,##0')}`
  }

  if (dataType === 'Number') {
    return formatReportNumber(value, displayFormat || '#,##0')
  }

  if (dataType === 'Percent') {
    return formatReportPercent(value, displayFormat || '0.0%')
  }

  return String(value)
}

export function resolveFieldValue(row, fieldKey) {
  return String(fieldKey || '')
    .split('.')
    .reduce((value, segment) => (value == null ? undefined : value?.[segment]), row)
}

export function getVarianceToneClass(row, variance) {
  const normalized = Number(variance || 0)
  if (!row?.usali_line_group) {
    return normalized >= 0 ? 'text-emerald-600' : 'text-rose-600'
  }

  const isRevenue = row.usali_line_group === 'REVENUE'
  const isExpenseClass = ['PAYROLL_AND_RELATED', 'OTHER_EXPENSE'].includes(row.usali_line_group)

  if (isRevenue) {
    return normalized >= 0 ? 'text-emerald-600' : 'text-rose-600'
  }

  if (isExpenseClass) {
    return normalized <= 0 ? 'text-emerald-600' : 'text-rose-600'
  }

  return normalized >= 0 ? 'text-emerald-600' : 'text-rose-600'
}

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function parseDate(value) {
  if (value instanceof Date) return value
  if (typeof value === 'number') {
    const asDate = new Date(value)
    return Number.isNaN(asDate.getTime()) ? null : asDate
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const isoMatch = /^\d{4}-\d{2}-\d{2}$/.exec(trimmed)
    if (isoMatch) {
      const [year, month, day] = trimmed.split('-').map(Number)
      return new Date(Date.UTC(year, month - 1, day))
    }
    const fallback = new Date(`${trimmed}T00:00:00`)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }

  return null
}

function formatReportDate(value, displayFormat) {
  const date = parseDate(value)
  if (!date) return String(value)

  const dd = String(date.getUTCDate()).padStart(2, '0')
  const mmm = MONTH_ABBR[date.getUTCMonth()]
  const yyyy = date.getUTCFullYear()

  switch (displayFormat) {
    case 'DD-MMM-YYYY':
    case undefined:
    case null:
      return `${dd}-${mmm}-${yyyy}`
    case 'DD/MM/YYYY':
      return `${dd}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${yyyy}`
    case 'YYYY-MM-DD':
      return `${yyyy}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
    default:
      return `${dd}-${mmm}-${yyyy}`
  }
}

function getDecimalPlaces(format) {
  const normalized = String(format || '').trim()
  const decimalMatch = /\.(0+)/.exec(normalized)
  return decimalMatch ? decimalMatch[1].length : 0
}

function formatReportNumber(value, format) {
  const decimals = getDecimalPlaces(format)
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatReportPercent(value, format) {
  const decimals = getDecimalPlaces(format) || 1
  const numericValue = Number(value || 0) * 100
  return `${numericValue.toFixed(decimals)}%`
}
