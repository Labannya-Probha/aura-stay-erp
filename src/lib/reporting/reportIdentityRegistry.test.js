import { describe, expect, it } from 'vitest'

import {
  getReportIdentity,
  getReportIdentityByCode,
  resolveReportIdentity,
} from './reportIdentityRegistry'

describe('reportIdentityRegistry', () => {
  it('resolves canonical report identity by route parts', () => {
    expect(getReportIdentity('accounts', 'profit-and-loss-statement')).toMatchObject({
      reportCode: 'RPT-013',
      slug: 'profit-and-loss-statement',
      route: '/reports/accounts/profit-and-loss-statement',
    })
  })

  it('resolves canonical report identity by report code', () => {
    expect(getReportIdentityByCode('RPT-032')).toMatchObject({
      departmentSlug: 'admin',
      slug: 'multi-property-consolidated-performance',
    })
  })

  it('prefers canonical registry values over mismatched incoming report metadata', () => {
    expect(
      resolveReportIdentity(
        {
          reportCode: 'RPT-013',
          slug: 'wrong-slug',
          title: 'Wrong Title',
          route: '/reports/accounts/wrong-slug',
        },
        { departmentSlug: 'accounts' },
      ),
    ).toMatchObject({
      reportCode: 'RPT-013',
      title: 'Profit & Loss Statement',
      slug: 'profit-and-loss-statement',
      route: '/reports/accounts/profit-and-loss-statement',
    })
  })
})
