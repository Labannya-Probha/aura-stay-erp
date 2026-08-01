import { describe, expect, it } from 'vitest'

import { normalizeReportGroup } from '../reportEngineAdapters'

describe('reportEngineAdapters.normalizeReportGroup', () => {
  it('hydrates report groups with canonical report identity values', () => {
    const group = normalizeReportGroup({
      department: { slug: 'accounts', name: 'Accounts' },
      reports: [
        {
          reportCode: 'RPT-013',
          title: 'Wrong Title',
          slug: 'wrong-slug',
          route: '/reports/accounts/wrong-slug',
        },
      ],
    })

    expect(group.reports[0]).toMatchObject({
      reportCode: 'RPT-013',
      title: 'Profit & Loss Statement',
      slug: 'profit-and-loss-statement',
      route: '/reports/accounts/profit-and-loss-statement',
    })
  })
})
