import { useMemo } from 'react'

const BDT = new Intl.NumberFormat('en-BD', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatAmount(value) {
  const number = Number(value || 0)
  const absolute = BDT.format(Math.abs(number))
  if (number < 0) return `(৳${absolute})`
  if (number === 0) return '—'
  return `৳${absolute}`
}

function isStructuredStatement(rows) {
  return rows.some((row) => row.line_code || row.current_amount !== undefined)
}

function legacyRowsToStatement(rows, groupByField) {
  const grouped = new Map()
  for (const row of rows) {
    const key = groupByField ? row[groupByField] || 'Other' : 'Statement'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(row)
  }

  const result = []
  let order = 100
  for (const [label, groupRows] of grouped.entries()) {
    if (groupByField) {
      result.push({
        line_code: `LEGACY.HEADER.${order}`,
        label,
        line_type: 'HEADER',
        display_order: order++,
        current_amount: 0,
      })
    }
    for (const row of groupRows) {
      result.push({
        ...row,
        line_code: row.account_code || `LEGACY.LINE.${order}`,
        label: row.account_name || row.line_item || 'Line item',
        line_type: 'DETAIL',
        display_order: order++,
        current_amount: Number(row.amount ?? row.value ?? 0),
        comparison_amount: Number(row.comparison_amount ?? 0),
      })
    }
  }
  return result
}

export default function FinancialStatementView({
  title,
  description,
  rows = [],
  summary = {},
  groupByField,
}) {
  const statementRows = useMemo(() => {
    const normalized = isStructuredStatement(rows)
      ? rows
      : legacyRowsToStatement(rows, groupByField)
    return [...normalized].sort(
      (left, right) => Number(left.display_order || 0) - Number(right.display_order || 0),
    )
  }, [rows, groupByField])

  const hasComparison = Boolean(
    summary.comparison_start ||
    summary.comparison_end ||
    statementRows.some((row) => Number(row.comparison_amount || 0) !== 0),
  )

  return (
    <section className="financial-statement">
      <header className="financial-statement__header">
        <h2>{title}</h2>
        {description ? <p className="financial-statement__description">{description}</p> : null}
        {summary.start_date && summary.end_date ? (
          <p className="financial-statement__period">
            For the period {summary.start_date} to {summary.end_date}
          </p>
        ) : summary.as_of_date ? (
          <p className="financial-statement__period">As of {summary.as_of_date}</p>
        ) : null}
        {summary.validation?.valid === false ? (
          <p className="financial-statement__validation-error">
            Report validation failed. Review mapping and ledger warnings before publication.
          </p>
        ) : null}
      </header>

      {statementRows.length === 0 ? (
        <div className="financial-statement__empty">
          No posted transactions were found for the selected reporting period.
        </div>
      ) : (
        <table className="financial-statement__table">
          <thead>
            <tr>
              <th scope="col">Particulars</th>
              <th scope="col">Current period</th>
              {hasComparison ? <th scope="col">Comparative</th> : null}
              {hasComparison ? <th scope="col">Variance</th> : null}
            </tr>
          </thead>
          <tbody>
            {statementRows.map((row) => {
              const rowType = String(row.line_type || 'DETAIL').toLowerCase()
              const classNames = [
                'financial-statement__row',
                `financial-statement__row--${rowType}`,
                row.is_bold ? 'is-bold' : '',
                row.is_underlined ? 'is-underlined' : '',
                row.is_double_underlined ? 'is-double-underlined' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <tr className={classNames} key={row.id || row.line_code}>
                  <td>
                    <span
                      className="financial-statement__label"
                      style={{ paddingInlineStart: `${Number(row.indent_level || 0) * 18}px` }}
                    >
                      {row.label || row.account_name || row.line_item}
                    </span>
                    {row.notes_reference ? (
                      <sup className="financial-statement__note-ref">{row.notes_reference}</sup>
                    ) : null}
                  </td>
                  <td className="financial-statement__line-amount">
                    {rowType === 'header' ? '' : formatAmount(row.current_amount ?? row.amount)}
                  </td>
                  {hasComparison ? (
                    <td className="financial-statement__line-amount">
                      {rowType === 'header' ? '' : formatAmount(row.comparison_amount)}
                    </td>
                  ) : null}
                  {hasComparison ? (
                    <td className="financial-statement__line-amount">
                      {rowType === 'header' ? '' : formatAmount(row.variance_amount)}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
