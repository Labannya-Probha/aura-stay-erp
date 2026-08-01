import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import FinancialStatementView from '../FinancialStatementView.jsx'

const structuredRows = [
  {
    id: 'revenue',
    line_code: 'PL.REVENUE',
    label: 'Revenue',
    line_type: 'ACCOUNT_GROUP',
    display_order: 100,
    indent_level: 0,
    current_amount: 150000,
    comparison_amount: 120000,
    variance_amount: 30000,
    is_bold: true,
    is_underlined: false,
    is_double_underlined: false,
  },
  {
    id: 'cos',
    line_code: 'PL.COS',
    label: 'Cost of Sales',
    line_type: 'ACCOUNT_GROUP',
    display_order: 200,
    indent_level: 0,
    current_amount: 50000,
    comparison_amount: 40000,
    variance_amount: 10000,
    is_bold: false,
    is_underlined: false,
    is_double_underlined: false,
  },
  {
    id: 'gross-profit',
    line_code: 'PL.GROSS_PROFIT',
    label: 'Gross Profit',
    line_type: 'CALCULATED',
    display_order: 300,
    indent_level: 0,
    current_amount: 100000,
    comparison_amount: 80000,
    variance_amount: 20000,
    is_bold: true,
    is_underlined: true,
    is_double_underlined: false,
  },
  {
    id: 'net-profit',
    line_code: 'PL.NET_PROFIT',
    label: 'Profit for the Period',
    line_type: 'GRAND_TOTAL',
    display_order: 1000,
    indent_level: 0,
    current_amount: -25000,
    comparison_amount: 10000,
    variance_amount: -35000,
    is_bold: true,
    is_underlined: false,
    is_double_underlined: true,
  },
]

function renderComponent(props = {}) {
  return renderToStaticMarkup(
    <FinancialStatementView
      title="Statement of Profit or Loss"
      description="IFRS-aligned financial statement"
      rows={structuredRows}
      summary={{
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        comparison_start: '2026-06-01',
        comparison_end: '2026-06-30',
        validation: {
          valid: true,
          errors: [],
          warnings: [],
        },
      }}
      {...props}
    />,
  )
}

describe('FinancialStatementView', () => {
  it('renders the statement title and reporting period', () => {
    const html = renderComponent()

    expect(html).toContain('Statement of Profit or Loss')
    expect(html).toContain('IFRS-aligned financial statement')
    expect(html).toContain('For the period 2026-07-01 to 2026-07-31')
  })

  it('renders structured financial statement lines', () => {
    const html = renderComponent()

    expect(html).toContain('Revenue')
    expect(html).toContain('Cost of Sales')
    expect(html).toContain('Gross Profit')
    expect(html).toContain('Profit for the Period')
  })

  it('renders current, comparative and variance columns', () => {
    const html = renderComponent()

    expect(html).toContain('Current period')
    expect(html).toContain('Comparative')
    expect(html).toContain('Variance')
  })

  it('formats positive amounts using BDT currency format', () => {
    const html = renderComponent()

    expect(html).toContain('৳150,000.00')
    expect(html).toContain('৳120,000.00')
    expect(html).toContain('৳30,000.00')
  })

  it('formats negative amounts using parentheses', () => {
    const html = renderComponent()

    expect(html).toContain('(৳25,000.00)')
    expect(html).toContain('(৳35,000.00)')
  })

  it('uses a dash for zero amounts', () => {
    const html = renderComponent({
      rows: [
        {
          id: 'zero',
          line_code: 'PL.REVENUE',
          label: 'Revenue',
          line_type: 'ACCOUNT_GROUP',
          display_order: 100,
          current_amount: 0,
          comparison_amount: 0,
          variance_amount: 0,
        },
      ],
      summary: {},
    })

    expect(html).toContain('—')
  })

  it('applies formatting classes from statement metadata', () => {
    const html = renderComponent()

    expect(html).toContain('is-bold')
    expect(html).toContain('is-underlined')
    expect(html).toContain('is-double-underlined')
    expect(html).toContain('financial-statement__row--grand_total')
  })

  it('sorts rows by display order', () => {
    const html = renderComponent({
      rows: [...structuredRows].reverse(),
    })

    const revenuePosition = html.indexOf('Revenue')
    const costPosition = html.indexOf('Cost of Sales')
    const grossProfitPosition = html.indexOf('Gross Profit')
    const netProfitPosition = html.indexOf('Profit for the Period')

    expect(revenuePosition).toBeLessThan(costPosition)
    expect(costPosition).toBeLessThan(grossProfitPosition)
    expect(grossProfitPosition).toBeLessThan(netProfitPosition)
  })

  it('renders an empty-state message when there are no rows', () => {
    const html = renderComponent({
      rows: [],
      summary: {},
    })

    expect(html).toContain('No posted transactions were found for the selected reporting period.')
  })

  it('shows a warning when report validation fails', () => {
    const html = renderComponent({
      summary: {
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        validation: {
          valid: false,
          errors: [
            {
              code: 'UNMAPPED_ACCOUNTS',
            },
          ],
        },
      },
    })

    expect(html).toContain(
      'Report validation failed. Review mapping and ledger warnings before publication.',
    )
  })

  it('supports legacy account rows during migration', () => {
    const html = renderComponent({
      rows: [
        {
          account_code: '4100',
          account_name: 'Room Revenue',
          statement_line: 'Revenue',
          amount: 75000,
        },
      ],
      summary: {},
      groupByField: 'statement_line',
    })

    expect(html).toContain('Revenue')
    expect(html).toContain('Room Revenue')
    expect(html).toContain('৳75,000.00')
  })

  it('does not render comparison columns when comparison is absent', () => {
    const html = renderComponent({
      rows: structuredRows.map((row) => ({
        ...row,
        comparison_amount: 0,
        variance_amount: 0,
      })),
      summary: {
        start_date: '2026-07-01',
        end_date: '2026-07-31',
      },
    })

    expect(html).not.toContain('Comparative')
    expect(html).not.toContain('Variance')
  })
})
