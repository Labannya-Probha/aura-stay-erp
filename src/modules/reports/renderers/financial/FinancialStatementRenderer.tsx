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
  variance_amount?: number | string | null
  variance_percent?: number | string | null
  amount?: number | string | null
  value?: number | string | null
  show_if_zero?: boolean
  is_bold?: boolean
  is_underlined?: boolean
  is_double_underlined?: boolean
  notes_reference?: string | null
  drilldown_url?: string | null
}

type FormattingSettings = {
  reporting_currency?: string
  currency_symbol?: string
  currency_position?: string
  decimal_places?: number
  amount_scale?: number
  amount_scale_label?: string
  negative_format?: string
  zero_format?: string
  show_account_codes?: boolean
  show_notes_column?: boolean
  show_variance_columns?: boolean
}

type ReportDefinition = {
  title?: string
  description?: string
  statement_type?: string
  report_code?: string
  status?: string
}

type Props = {
  report?: ReportDefinition
  period?: Record<string, any>
  formatting?: FormattingSettings
  validation?: {
    valid?: boolean
    balanced?: boolean
    generated_at?: string
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
  const current =
    line.current_amount !== undefined
      ? line.current_amount
      : line.amount !== undefined
        ? line.amount
        : line.value

  const comparison = line.comparison_amount
  const variance =
    line.variance_amount !== undefined && line.variance_amount !== null
      ? line.variance_amount
      : comparison !== undefined && comparison !== null
        ? toNumber(current) - toNumber(comparison)
        : null

  const variancePercent =
    line.variance_percent !== undefined && line.variance_percent !== null
      ? line.variance_percent
      : comparison !== undefined && comparison !== null
        ? toNumber(comparison) !== 0
          ? (toNumber(variance) / Math.abs(toNumber(comparison))) * 100
          : toNumber(current) !== 0
            ? 100
            : 0
        : null

  return {
    ...line,
    line_code: line.line_code || `LEGACY.${index}`,
    label: line.label || line.line_item || line.account_name || 'Unlabelled line',
    display_order: Number(line.display_order ?? index),
    indent_level: Number(line.indent_level ?? 0),
    line_type: String(line.line_type || 'LINE').toUpperCase(),
    current_amount: current,
    comparison_amount: comparison,
    variance_amount: variance,
    variance_percent: variancePercent,
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

function createPercentFormatter(decimals = 1) {
  return (value: unknown) => {
    const numeric = toNumber(value)
    if (Math.abs(numeric) < 0.0001) return '—'
    return `${numeric.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}%`
  }
}

function lineClassName(line: StatementLine) {
  const type = String(line.line_type || '').toUpperCase()

  return [
    'financial-statement-line',
    type === 'HEADER' || type === 'SECTION' ? 'financial-statement-line--header' : '',
    type === 'SUBTOTAL' || line.is_underlined ? 'financial-statement-line--subtotal' : '',
    type === 'GRAND_TOTAL' || line.is_double_underlined
      ? 'financial-statement-line--grand-total'
      : '',
    type === 'CALCULATED' ? 'financial-statement-line--calculated' : '',
    type === 'MEMO' ? 'financial-statement-line--memo' : '',
    line.is_bold ? 'financial-statement-line--bold' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function formatDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function resolvePeriod(period: Record<string, any> = {}) {
  const start = period.start_date || period.period_start || period.startDate || period.date_from
  const end = period.end_date || period.period_end || period.endDate || period.date_to
  const asOf = period.as_of_date || period.asOfDate
  const comparisonStart =
    period.comparison_start_date || period.previous_period_start || period.comparisonStartDate
  const comparisonEnd =
    period.comparison_end_date || period.previous_period_end || period.comparisonEndDate

  const currentLabel =
    start && end
      ? `${formatDate(start)} – ${formatDate(end)}`
      : asOf || end
        ? `As at ${formatDate(asOf || end)}`
        : 'Current period'

  const comparisonLabel =
    comparisonStart && comparisonEnd
      ? `${formatDate(comparisonStart)} – ${formatDate(comparisonEnd)}`
      : period.comparison_label || period.previous_period_label || 'Comparative'

  return {
    currentLabel,
    comparisonLabel,
    statementLabel:
      start && end
        ? `For the period ended ${formatDate(end)}`
        : asOf || end
          ? `As at ${formatDate(asOf || end)}`
          : null,
  }
}

function varianceTone(value: unknown) {
  const amount = toNumber(value)
  if (amount > 0) return 'financial-statement-variance--positive'
  if (amount < 0) return 'financial-statement-variance--negative'
  return 'financial-statement-variance--neutral'
}

function statusLabel(report?: ReportDefinition, validation?: Props['validation']) {
  if (validation?.valid === false) return 'Validation failed'
  if (validation?.balanced === false) return 'Out of balance'
  if (report?.status) return report.status
  return 'Generated'
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
        Preparing financial statement…
      </section>
    )
  }

  const normalizedLines = lines
    .map(normalizeLine)
    .filter((line) => {
      const lineType = String(line.line_type).toUpperCase()
      if (line.show_if_zero) return true
      if (lineType === 'HEADER' || lineType === 'SECTION' || lineType === 'MEMO') return true
      return toNumber(line.current_amount) !== 0 || toNumber(line.comparison_amount) !== 0
    })
    .sort((left, right) => Number(left.display_order || 0) - Number(right.display_order || 0))

  const hasComparison = normalizedLines.some(
    (line) => line.comparison_amount !== undefined && line.comparison_amount !== null,
  )
  const showNotes = Boolean(formatting.show_notes_column)
  const showCodes = Boolean(formatting.show_account_codes)
  const showVariance = Boolean(formatting.show_variance_columns && hasComparison)
  const formatAmount = createAmountFormatter(formatting)
  const formatPercent = createPercentFormatter(1)
  const resolvedPeriod = resolvePeriod(period)
  const validationErrors = validation?.errors || []
  const validationWarnings = validation?.warnings || []
  const scaleLabel =
    formatting.amount_scale_label ||
    (Number(formatting.amount_scale || 1) === 1000
      ? 'Amounts in thousands'
      : Number(formatting.amount_scale || 1) === 1000000
        ? 'Amounts in millions'
        : null)

  const visibleColumns = 2 + Number(hasComparison) + Number(showNotes) + Number(showVariance) * 2

  return (
    <article
      className="financial-statement-document"
      aria-label={report?.title || 'Financial statement'}
    >
      <header className="financial-statement-heading">
        <div className="financial-statement-heading__primary">
          <span className="financial-statement-heading__type">
            {report?.statement_type || 'Financial statement'}
          </span>
          <h2>{report?.title || 'Financial Statement'}</h2>
          {resolvedPeriod.statementLabel ? <p>{resolvedPeriod.statementLabel}</p> : null}
        </div>

        <div className="financial-statement-heading__meta">
          <dl>
            {report?.report_code ? (
              <div>
                <dt>Report code</dt>
                <dd>{report.report_code}</dd>
              </div>
            ) : null}
            <div>
              <dt>Currency</dt>
              <dd>{formatting.reporting_currency || 'BDT'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{statusLabel(report, validation)}</dd>
            </div>
          </dl>
          {scaleLabel ? <span>{scaleLabel}</span> : null}
        </div>
      </header>

      {validation?.valid === false || validation?.balanced === false ? (
        <section
          className="financial-statement-validation financial-statement-validation--error"
          role="alert"
        >
          <strong>Statement cannot be treated as final.</strong>
          {validationErrors.length > 0 ? (
            validationErrors.map((error, index) => (
              <span key={`${error.code || 'error'}-${index}`}>
                {error.message || error.code || 'Financial validation error'}
              </span>
            ))
          ) : (
            <span>The statement failed one or more financial validation controls.</span>
          )}
        </section>
      ) : null}

      {validationWarnings.length > 0 ? (
        <section className="financial-statement-validation financial-statement-validation--warning">
          <strong>Review required</strong>
          {validationWarnings.map((warning, index) => (
            <span key={`${warning.code || 'warning'}-${index}`}>
              {warning.message || warning.code}
            </span>
          ))}
        </section>
      ) : null}

      {normalizedLines.length === 0 ? (
        <div className="financial-statement-empty">
          No reportable balances were returned for the selected period.
        </div>
      ) : (
        <div className="financial-statement-table-wrap">
          <table className="financial-statement-table">
            <thead>
              <tr>
                <th scope="col" className="financial-statement-particulars">
                  Particulars
                </th>
                {showNotes ? (
                  <th scope="col" className="financial-statement-notes-column">
                    Note
                  </th>
                ) : null}
                <th scope="col" className="financial-statement-amount">
                  <span>Current</span>
                  <small>{resolvedPeriod.currentLabel}</small>
                </th>
                {hasComparison ? (
                  <th scope="col" className="financial-statement-amount">
                    <span>Comparative</span>
                    <small>{resolvedPeriod.comparisonLabel}</small>
                  </th>
                ) : null}
                {showVariance ? (
                  <>
                    <th scope="col" className="financial-statement-amount">
                      <span>Variance</span>
                      <small>Amount</small>
                    </th>
                    <th scope="col" className="financial-statement-amount">
                      <span>Variance</span>
                      <small>%</small>
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {normalizedLines.map((line, index) => {
                const lineType = String(line.line_type).toUpperCase()
                const isHeader = lineType === 'HEADER' || lineType === 'SECTION'
                const key = line.id || line.line_code || index

                if (isHeader) {
                  return (
                    <tr key={key} className={lineClassName(line)}>
                      <th colSpan={visibleColumns} scope="rowgroup">
                        {line.label}
                      </th>
                    </tr>
                  )
                }

                return (
                  <tr key={key} className={lineClassName(line)}>
                    <td className="financial-statement-particulars">
                      <div
                        className="financial-statement-label"
                        style={{
                          paddingInlineStart: `${
                            Math.max(0, Number(line.indent_level || 0)) * 1.125
                          }rem`,
                        }}
                      >
                        {showCodes && line.account_code ? (
                          <span className="financial-statement-code">{line.account_code}</span>
                        ) : null}

                        {line.drilldown_url ? (
                          <a href={line.drilldown_url}>{line.label}</a>
                        ) : (
                          <span>{line.label}</span>
                        )}
                      </div>
                    </td>

                    {showNotes ? (
                      <td className="financial-statement-notes-column">
                        {line.notes_reference ? (
                          <a
                            href={`/reports/notes#note-${line.notes_reference}`}
                            className="financial-statement-note-link"
                            title={`See Note ${line.notes_reference}`}
                          >
                            {line.notes_reference}
                          </a>
                        ) : (
                          ''
                        )}
                      </td>
                    ) : null}

                    <td className="financial-statement-amount">
                      {formatAmount(line.current_amount)}
                    </td>

                    {hasComparison ? (
                      <td className="financial-statement-amount">
                        {formatAmount(line.comparison_amount)}
                      </td>
                    ) : null}

                    {showVariance ? (
                      <>
                        <td
                          className={`financial-statement-amount ${varianceTone(
                            line.variance_amount,
                          )}`}
                        >
                          {formatAmount(line.variance_amount)}
                        </td>
                        <td
                          className={`financial-statement-amount ${varianceTone(
                            line.variance_percent,
                          )}`}
                        >
                          {formatPercent(line.variance_percent)}
                        </td>
                      </>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className="financial-statement-footer">
        <div>
          <strong>Statement basis</strong>
          <span>
            Generated from the validated reporting dataset. Values displayed here must reconcile
            with the server-generated PDF and Excel outputs.
          </span>
        </div>
        <dl>
          {validation?.generated_at ? (
            <div>
              <dt>Generated</dt>
              <dd>{formatDate(validation.generated_at)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Validation</dt>
            <dd>{validation?.valid === false ? 'Failed' : 'Passed'}</dd>
          </div>
        </dl>
      </footer>
    </article>
  )
}
