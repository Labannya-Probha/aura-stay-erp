import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import MetadataReportTable from './MetadataReportTable'

describe('MetadataReportTable', () => {
  it('does not force ungrouped reports into synthetic section headers or subtotals', () => {
    const markup = renderToStaticMarkup(
      <MetadataReportTable
        fields={[
          { fieldKey: 'account_name', label: 'Account', dataType: 'Text', alignment: 'left' },
          {
            fieldKey: 'amount',
            label: 'Amount',
            dataType: 'Currency-BDT',
            alignment: 'right',
            aggregation: 'SUM',
          },
        ]}
        rows={[
          { account_name: 'Cash', amount: 1000 },
          { account_name: 'Revenue', amount: 2000 },
        ]}
      />,
    )

    expect(markup).not.toContain('Section Total')
    expect(markup).not.toContain('Unclassified')
  })

  it('does not build comparison totals for non-additive percentage fields', () => {
    const markup = renderToStaticMarkup(
      <MetadataReportTable
        fields={[
          {
            fieldKey: 'occupancy_rate',
            label: 'Occupancy',
            dataType: 'Percent',
            alignment: 'right',
            aggregation: 'NONE',
          },
        ]}
        rows={[{ occupancy_rate: 82 }]}
        comparisonRows={[{ occupancy_rate: 78 }]}
        comparisonSummary={{
          enabled: true,
          currentPeriodLabel: '2026-07-01 to 2026-07-31',
          previousPeriodLabel: '2026-06-01 to 2026-06-30',
        }}
      />,
    )

    expect(markup).not.toContain('Comparison enabled')
  })
})
