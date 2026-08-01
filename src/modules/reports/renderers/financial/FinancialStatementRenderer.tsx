type StatementLine = {
  id?: string
  line_code?: string
  label?: string
  line_item?: string
  account_name?: string
  account_code?: string
  display_order?: number
  indent_level?: number
  line_type?: string
  current_amount?: number | string | null
  comparison_amount?: number | string | null
  amount?: number | string | null
  value?: number | string | null
  show_if_zero?: boolean
  is_bold?: boolean
  is_underlined?: boolean
  is_double_underlined?: boolean
  notes_reference?: string | null
}

type FormattingSettings = {
  reporting_currency?: string
  currency_symbol?: string
  currency_position?: string
  decimal_places?: number
  amount_scale?: number
  negative_format?: string
  zero_format?: string
  show_account_codes?: boolean
  show_notes_column?: boolean
}

type Props = {
  report?: { title?: string; description?: string }
  period?: Record<string, any>
  formatting?: FormattingSettings
  validation?: {
    valid?: boolean
    errors?: Array<{ code?: string; message?: string }>
    warnings?: Array<{ code?: string; message?: string }>
  }
  lines?: StatementLine[]
  loading?: boolean
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function normalizeLine(line: StatementLine, index: number): StatementLine {
  return {
    ...line,
    line_code: line.line_code || `LEGACY.${index}`,
    label: line.label || line.line_item || line.account_name || 'Unlabelled line',
    display_order: Number(line.display_order ?? index),
    indent_level: Number(line.indent_level ?? 0),
    line_type: String(line.line_type || 'LINE').toUpperCase(),
    current_amount:
      line.current_amount !== undefined
        ? line.current_amount
        : line.amount !== undefined
          ? line.amount
          : line.value,
  }
}

function createAmountFormatter(settings: FormattingSettings = {}) {
  const decimals = Number.isFinite(Number(settings.decimal_places))
    ? Number(settings.decimal_places)
    : 2
  const scale = Number(settings.amount_scale || 1) || 1
  const symbol = settings.currency_symbol || settings.reporting_currency || '৳'
  const position = String(settings.currency_position || 'before').toLowerCase()
  const negativeFormat = String(settings.negative_format || 'parentheses').toLowerCase()
  const zeroFormat = String(settings.zero_format || 'dash').toLowerCase()

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (rawValue: unknown) => {
    const scaledValue = toNumber(rawValue) / scale

    if (Math.abs(scaledValue) < 1 / 10 ** Math.max(decimals, 1)) {
      if (zeroFormat === 'dash') return '—'
      if (zeroFormat === 'blank') return ''
    }

    const absolute = formatter.format(Math.abs(scaledValue))
    const withSymbol = position === 'after' ? `${absolute} ${symbol}` : `${symbol}${absolute}`

    if (scaledValue < 0) {
      if (negativeFormat === 'minus') return `-${withSymbol}`
      return `(${withSymbol})`
    }

    return withSymbol
  }
}

function lineClassName(line: StatementLine) {
  const type = String(line.line_type || '').toUpperCase()

  return [
    'financial-statement-line',
    type === 'HEADER' ? 'financial-statement-line--header' : '',
    type === 'SUBTOTAL' || line.is_underlined ? 'financial-statement-line--subtotal' : '',
    type === 'GRAND_TOTAL' || line.is_double_underlined
      ? 'financial-statement-line--grand-total'
      : '',
    type === 'CALCULATED' ? 'financial-statement-line--calculated' : '',
    line.is_bold ? 'financial-statement-line--bold' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function formatPeriod(period: Record<string, any> = {}) {
  const start = period.start_date || period.period_start || period.startDate || period.date_from
  const end = period.end_date || period.period_end || period.endDate || period.date_to
  const asOf = period.as_of_date || period.asOfDate

  if (start && end) return `For the period ${start} to ${end}`
  if (asOf || end) return `As at ${asOf || end}`
  return null
}

export default function FinancialStatementRenderer({
  report,
  period,
  formatting = {},
  validation,
  lines = [],
  loading = false,
}: Props) {
  if (loading) {
    return (
      <section className="financial-statement-document financial-statement-loading">
        Loading financial statement…
      </section>
    )
  }

  const normalizedLines = lines
    .map(normalizeLine)
    .filter((line) => {
      if (line.show_if_zero) return true
      if (String(line.line_type).toUpperCase() === 'HEADER') return true
      return toNumber(line.current_amount) !== 0 || toNumber(line.comparison_amount) !== 0
    })
    .sort((left, right) => Number(left.display_order || 0) - Number(right.display_order || 0))

  const hasComparison = normalizedLines.some(
    (line) => line.comparison_amount !== undefined && line.comparison_amount !== null,
  )
  const showNotes = Boolean(formatting.show_notes_column)
  const showCodes = Boolean(formatting.show_account_codes)
  const formatAmount = createAmountFormatter(formatting)
  const statementPeriod = formatPeriod(period)
  const validationErrors = validation?.errors || []
  const validationWarnings = validation?.warnings || []

  return (
    <section
      className="financial-statement-document"
      aria-label={report?.title || 'Financial statement'}
    >
      {validation?.valid === false ? (
        <div
          className="financial-statement-validation financial-statement-validation--error"
          role="alert"
        >
          <strong>Statement validation failed.</strong>
          {validationErrors.map((error, index) => (
            <span key={`${error.code || 'error'}-${index}`}>
              {error.message || error.code || 'Financial validation error'}
            </span>
          ))}
        </div>
      ) : null}

      {validationWarnings.length > 0 ? (
        <div className="financial-statement-validation financial-statement-validation--warning">
          {validationWarnings.map((warning, index) => (
            <span key={`${warning.code || 'warning'}-${index}`}>
              {warning.message || warning.code}
            </span>
          ))}
        </div>
      ) : null}

      <header className="financial-statement-heading">
        <h2>{report?.title || 'Financial Statement'}</h2>
        {statementPeriod ? <p>{statementPeriod}</p> : null}
        {formatting.reporting_currency ? (
          <p>
            Currency: {formatting.reporting_currency}
            {Number(formatting.amount_scale || 1) !== 1
              ? ` · Amounts scaled by ${formatting.amount_scale}`
              : ''}
          </p>
        ) : null}
      </header>

      {normalizedLines.length === 0 ? (
        <div className="financial-statement-empty">
          No reportable balances were returned for the selected period.
        </div>
      ) : (
        <div className="financial-statement-table-wrap">
          <table className="financial-statement-table">
            <thead>
              <tr>
                <th scope="col">Particulars</th>
                <th scope="col" className="financial-statement-amount">
                  Current
                </th>
                {hasComparison ? (
                  <th scope="col" className="financial-statement-amount">
                    Comparative
                  </th>
                ) : null}
                {showNotes ? <th scope="col">Notes</th> : null}
              </tr>
            </thead>
            <tbody>
              {normalizedLines.map((line, index) => {
                const isHeader = String(line.line_type).toUpperCase() === 'HEADER'
                const visibleColumns = 2 + Number(hasComparison) + Number(showNotes)

                if (isHeader) {
                  return (
                    <tr key={line.id || line.line_code || index} className={lineClassName(line)}>
                      <th colSpan={visibleColumns} scope="rowgroup">
                        {line.label}
                      </th>
                    </tr>
                  )
                }

                return (
                  <tr key={line.id || line.line_code || index} className={lineClassName(line)}>
                    <td>
                      <div
                        className="financial-statement-label"
                        style={{
                          paddingInlineStart: `${
                            Math.max(0, Number(line.indent_level || 0)) * 1.25
                          }rem`,
                        }}
                      >
                        {showCodes && line.account_code ? (
                          <span className="financial-statement-code">{line.account_code}</span>
                        ) : null}
                        <span>{line.label}</span>
                      </div>
                    </td>
                    <td className="financial-statement-amount">
                      {formatAmount(line.current_amount)}
                    </td>
                    {hasComparison ? (
                      <td className="financial-statement-amount">
                        {formatAmount(line.comparison_amount)}
                      </td>
                    ) : null}
                    {showNotes ? <td>{line.notes_reference || ''}</td> : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
