/**
 * Formats a report cell value according to its registered data_type AND
 * display_format string (e.g. "DD-MMM-YYYY", "#,##0", "#,##0.00", "0.0%").
 *
 * Previously this function accepted `displayFormat` but never used it,
 * hardcoding one fixed rendering per data type instead — most visibly, dates
 * rendered as "26 Jul 2026" (en-GB, spaces) instead of the spec's required
 * "26-Jul-2026" (hyphens). Fixed to genuinely honor whatever format string
 * is registered in report_fields.display_format, falling back to a sensible
 * default only when no format is registered at all.
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

/** Supports the two date formats this codebase actually registers today:
 *  DD-MMM-YYYY (spec default, e.g. "26-Jul-2026") and ISO passthrough as a
 *  safe fallback for any unrecognized format string. */
function formatReportDate(value, displayFormat) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return String(value)

  const dd = String(date.getDate()).padStart(2, '0')
  const mmm = MONTH_ABBR[date.getMonth()]
  const yyyy = date.getFullYear()

  switch (displayFormat) {
    case 'DD-MMM-YYYY':
    case undefined:
    case null:
      return `${dd}-${mmm}-${yyyy}`
    case 'DD/MM/YYYY':
      return `${dd}/${String(date.getMonth() + 1).padStart(2, '0')}/${yyyy}`
    case 'YYYY-MM-DD':
      return date.toISOString().slice(0, 10)
    default:
      return `${dd}-${mmm}-${yyyy}`
  }
}

/** Reads decimal-place count from the format string itself (e.g. "#,##0.00"
 * -> 2 decimals, "#,##0" -> 0 decimals) rather than hardcoding one choice. */
function formatReportNumber(value, format) {
  const decimalMatch = /\.(0+)/.exec(format || '')
  const decimals = decimalMatch ? decimalMatch[1].length : 0
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatReportPercent(value, format) {
  const decimalMatch = /\.(0+)/.exec(format || '')
  const decimals = decimalMatch ? decimalMatch[1].length : 1
  return `${Number(value || 0).toFixed(decimals)}%`
}
