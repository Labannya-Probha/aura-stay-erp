from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path.cwd()

DYNAMIC_PAGE = ROOT / "src/modules/reports/pages/DynamicReportPage.tsx"
PRINT_CSS = ROOT / "src/components/reports/print-report.css"
RENDERER_DIR = ROOT / "src/modules/reports/renderers"
FINANCIAL_DIR = RENDERER_DIR / "financial"
REPORT_RENDERER = RENDERER_DIR / "ReportRenderer.tsx"
FINANCIAL_RENDERER = FINANCIAL_DIR / "FinancialStatementRenderer.tsx"


def fail(message: str) -> None:
    print(f"[ERROR] {message}")
    sys.exit(1)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 0:
        fail(f"Could not find marker for {label}. Your local file differs from the expected structure.")
    if count > 1:
        fail(f"Found {count} matches for {label}; refusing an ambiguous replacement.")
    return text.replace(old, new, 1)


if not DYNAMIC_PAGE.exists():
    fail(f"Missing file: {DYNAMIC_PAGE}")

if not PRINT_CSS.exists():
    fail(f"Missing file: {PRINT_CSS}")

dynamic = DYNAMIC_PAGE.read_text(encoding="utf-8")

if "import ReportRenderer from '../renderers/ReportRenderer'" not in dynamic:
    dynamic = replace_once(
        dynamic,
        "import MetadataReportTable from '../components/MetadataReportTable'\n",
        "import MetadataReportTable from '../components/MetadataReportTable'\n"
        "import ReportRenderer from '../renderers/ReportRenderer'\n",
        "ReportRenderer import",
    )

dynamic = dynamic.replace(
    'className="min-w-0 space-y-5 enterprise-print-doc"',
    'className="erp-print-doc erp-report-body min-w-0 space-y-5 enterprise-print-doc"',
)

old_table = """        <MetadataReportTable
          fields={fields}
          rows={data.rows}
          comparisonRows={data.comparisonRows || []}
          comparisonSummary={data.comparisonSummary || { enabled: false }}
          loading={loading}
        />"""

new_table = """        <ReportRenderer
          definition={definition}
          slug={slug}
          data={data}
          loading={loading}
          fallback={
            <MetadataReportTable
              fields={fields}
              rows={data.rows}
              comparisonRows={data.comparisonRows || []}
              comparisonSummary={data.comparisonSummary || { enabled: false }}
              loading={loading}
            />
          }
        />"""

if "<ReportRenderer" not in dynamic:
    dynamic = replace_once(
        dynamic,
        old_table,
        new_table,
        "MetadataReportTable renderer block",
    )

DYNAMIC_PAGE.write_text(dynamic, encoding="utf-8")

RENDERER_DIR.mkdir(parents=True, exist_ok=True)
FINANCIAL_DIR.mkdir(parents=True, exist_ok=True)

REPORT_RENDERER.write_text(
r"""import type { ReactNode } from 'react'

import FinancialStatementRenderer from './financial/FinancialStatementRenderer'

type ReportRendererProps = {
  definition?: any
  slug?: string
  data?: any
  loading?: boolean
  fallback: ReactNode
}

const FINANCIAL_STATEMENT_SLUGS = new Set([
  'profit-and-loss-statement',
  'balance-sheet',
  'cash-flow-statement',
  'statement-of-changes-in-equity',
  'changes-in-equity',
  'usali-departmental-statement',
])

function resolveRendererKey(definition: any, slug?: string) {
  const configured =
    definition?.report?.renderer ||
    definition?.report?.displayMode ||
    definition?.renderer ||
    definition?.displayMode

  if (configured) return String(configured).trim().toLowerCase()

  if (slug && FINANCIAL_STATEMENT_SLUGS.has(slug)) {
    return 'financial_statement'
  }

  return 'transaction_table'
}

export default function ReportRenderer({
  definition,
  slug,
  data,
  loading = false,
  fallback,
}: ReportRendererProps) {
  const rendererKey = resolveRendererKey(definition, slug)

  if (
    rendererKey === 'financial_statement' ||
    rendererKey === 'configured_financial_statement'
  ) {
    return (
      <FinancialStatementRenderer
        report={definition?.report}
        period={data?.period || data?.summary?.period || data?.summary}
        formatting={data?.formatting || data?.summary?.formatting}
        validation={data?.validation || data?.summary?.validation}
        lines={data?.lines || data?.rows || []}
        loading={loading}
      />
    )
  }

  return <>{fallback}</>
}
""",
    encoding="utf-8",
)

FINANCIAL_RENDERER.write_text(
r"""type StatementLine = {
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
    .sort(
      (left, right) =>
        Number(left.display_order || 0) - Number(right.display_order || 0),
    )

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
                    <tr
                      key={line.id || line.line_code || index}
                      className={lineClassName(line)}
                    >
                      <th colSpan={visibleColumns} scope="rowgroup">
                        {line.label}
                      </th>
                    </tr>
                  )
                }

                return (
                  <tr
                    key={line.id || line.line_code || index}
                    className={lineClassName(line)}
                  >
                    <td>
                      <div
                        className="financial-statement-label"
                        style={{
                          paddingInlineStart: `${Math.max(
                            0,
                            Number(line.indent_level || 0),
                          ) * 1.25}rem`,
                        }}
                      >
                        {showCodes && line.account_code ? (
                          <span className="financial-statement-code">
                            {line.account_code}
                          </span>
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
""",
    encoding="utf-8",
)

css = PRINT_CSS.read_text(encoding="utf-8")
marker = "/* F1_FINANCIAL_STATEMENT_STYLES */"
if marker not in css:
    css += r"""

/* F1_FINANCIAL_STATEMENT_STYLES */
.financial-statement-document {
  width: 100%;
  overflow: hidden;
  border: 1px solid #e5e2da;
  border-radius: 18px;
  background: #fff;
  color: #171717;
}

.financial-statement-heading {
  padding: 24px 28px 18px;
  text-align: center;
  border-bottom: 1px solid #dedbd3;
}

.financial-statement-heading h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
}

.financial-statement-heading p {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #6b6b6b;
}

.financial-statement-validation {
  display: grid;
  gap: 4px;
  margin: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.financial-statement-validation--error {
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #9f1239;
}

.financial-statement-validation--warning {
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.financial-statement-table-wrap {
  overflow-x: auto;
  padding: 14px 24px 26px;
}

.financial-statement-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
  font-variant-numeric: tabular-nums lining-nums;
}

.financial-statement-table thead th {
  padding: 8px 6px;
  border-bottom: 2px solid #171717;
  color: #555;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.financial-statement-table thead th:first-child {
  text-align: left;
}

.financial-statement-table td,
.financial-statement-table tbody th {
  padding: 7px 6px;
  vertical-align: top;
}

.financial-statement-line--header th {
  padding-top: 18px;
  border-bottom: 1px solid #d8d4cb;
  color: var(--tenant-primary, #1b4d2e);
  font-size: 0.74rem;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.financial-statement-label {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.financial-statement-code {
  min-width: 68px;
  color: #777;
  font-family: var(--aeds-font-mono, ui-monospace, monospace);
  font-size: 0.72rem;
}

.financial-statement-amount {
  min-width: 132px;
  text-align: right;
  white-space: nowrap;
  font-family: var(--aeds-font-mono, ui-monospace, monospace);
}

.financial-statement-line--bold td,
.financial-statement-line--calculated td {
  font-weight: 700;
}

.financial-statement-line--subtotal td {
  padding-top: 9px;
  border-top: 1px solid #171717;
  font-weight: 700;
}

.financial-statement-line--grand-total td {
  padding-top: 10px;
  border-top: 3px double #171717;
  border-bottom: 3px double #171717;
  font-weight: 800;
}

.financial-statement-empty,
.financial-statement-loading {
  padding: 48px 24px;
  text-align: center;
  color: #777;
  font-size: 0.85rem;
}

@media print {
  .erp-print-doc,
  .enterprise-print-doc {
    max-width: none;
    margin: 0;
  }

  .erp-report-body,
  .financial-statement-document {
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .financial-statement-heading {
    padding: 0 0 14px;
  }

  .financial-statement-table-wrap {
    overflow: visible;
    padding: 0;
  }

  .financial-statement-table thead {
    display: table-header-group;
  }

  .financial-statement-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
"""
    PRINT_CSS.write_text(css, encoding="utf-8")

print("[OK] Financial statement renderer installed.")
print("[OK] Updated:", DYNAMIC_PAGE)
print("[OK] Created:", REPORT_RENDERER)
print("[OK] Created:", FINANCIAL_RENDERER)
print("[OK] Updated:", PRINT_CSS)
print()
print("Next commands:")
print("  npm run lint")
print("  npm run typecheck")
print("  npm test -- --run")
print("  npm run build")
