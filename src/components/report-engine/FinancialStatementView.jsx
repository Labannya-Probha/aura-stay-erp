import { useMemo } from 'react'

/**
 * Renders a financial statement (P&L, Balance Sheet, USALI departmental
 * statement, Cash Flow, Changes in Equity) the way an accountant expects to
 * see one — grouped sections with headers, indented line items, bold
 * subtotal rows with a top border, negative amounts in parentheses, and a
 * final grand-total row with a double border. This intentionally does NOT
 * use pagination or a generic data-grid — a financial statement is read as
 * one continuous document, not browsed page-by-page.
 *
 * Distinct from AedsDataGrid (used for tabular/list reports like Trial
 * Balance or AR Aging), which is the right tool for row-per-transaction
 * data but the wrong one for a formatted statement.
 */

const BDT = new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatAmount(value) {
  const n = Number(value || 0)
  const abs = BDT.format(Math.abs(n))
  if (n < 0) return `(৳${abs})`
  return `৳${abs}`
}

function sumBy(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0)
}

export default function FinancialStatementView({
  title,
  description,
  rows = [],
  summary = {},
  groupByField,
  summaryTotalKey,
}) {
  const groups = useMemo(() => {
    if (!groupByField) {
      // No grouping (e.g. Statement of Changes in Equity) — render as a
      // simple sequential list of line items instead of sectioned groups.
      return [{ label: null, rows }]
    }
    const byGroup = new Map()
    for (const row of rows) {
      const key = row[groupByField] || 'Other'
      if (!byGroup.has(key)) byGroup.set(key, [])
      byGroup.get(key).push(row)
    }
    return Array.from(byGroup.entries()).map(([label, groupRows]) => ({ label, rows: groupRows }))
  }, [rows, groupByField])

  const grandTotal = summaryTotalKey ? Number(summary[summaryTotalKey] || 0) : null
  const isEmpty = rows.length === 0

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
      </header>

      {isEmpty ? (
        <div className="financial-statement__empty">
          No transactions posted for this period yet. This statement will populate once journal
          entries exist for the selected date range.
        </div>
      ) : (
        <table className="financial-statement__table">
          <tbody>
            {groups.map((group, groupIndex) => {
              const groupSubtotal = sumBy(group.rows, 'amount')

              return (
                <>
                  {group.label ? (
                    <tr className="financial-statement__section-header" key={`h-${groupIndex}`}>
                      <td colSpan={2}>{group.label}</td>
                    </tr>
                  ) : null}

                  {group.rows.map((row, rowIndex) => (
                    <tr className="financial-statement__line" key={`${groupIndex}-${rowIndex}`}>
                      <td className="financial-statement__line-label">
                        <span className="financial-statement__account-code">
                          {row.account_code}
                        </span>
                        <span>{row.account_name || row.line_item}</span>
                      </td>
                      <td className="financial-statement__line-amount">
                        {formatAmount(row.amount ?? row.value)}
                      </td>
                    </tr>
                  ))}

                  {group.label ? (
                    <tr className="financial-statement__subtotal" key={`st-${groupIndex}`}>
                      <td>Total {group.label}</td>
                      <td className="financial-statement__line-amount">
                        {formatAmount(groupSubtotal)}
                      </td>
                    </tr>
                  ) : null}
                </>
              )
            })}

            {grandTotal !== null && (
              <tr className="financial-statement__grand-total">
                <td>
                  {summaryTotalKey === 'net_profit'
                    ? 'Net Profit / (Loss)'
                    : summaryTotalKey === 'net_change_in_cash'
                      ? 'Net Change in Cash'
                      : summaryTotalKey === 'closing_equity'
                        ? 'Closing Equity'
                        : 'Total'}
                </td>
                <td className="financial-statement__line-amount">{formatAmount(grandTotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}
