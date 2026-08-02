import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import DynamicReportPage from './DynamicReportPage'

const mockUseDynamicReport = vi.fn()

vi.mock('react-router-dom', () => ({
  useParams: () => ({ department: 'accounts', slug: 'income-statement' }),
}))

vi.mock('../hooks/useDynamicReport', () => ({
  useDynamicReport: (...args: any[]) => mockUseDynamicReport(...args),
}))

vi.mock('../../../components/report-engine/reportEngine.service', () => ({
  enqueueAedsReportExport: vi.fn(),
  waitForAedsReportExportJob: vi.fn(),
}))

vi.mock('../utils/reportExport', () => ({
  exportReportExcel: vi.fn(),
}))

vi.mock('../components/ReportingStudioShell', () => ({
  default: ({ children, title }: any) => (
    <section data-testid="shell">
      <h1>{title}</h1>
      {children}
    </section>
  ),
}))

vi.mock('../components/MetadataReportFilters', () => ({
  default: () => <div data-testid="filters">filters</div>,
}))

vi.mock('../components/MetadataReportTable', () => ({
  default: () => <div data-testid="fallback-table">fallback-table</div>,
}))

vi.mock('../renderers/ReportRenderer', () => ({
  default: () => <div data-testid="renderer">renderer</div>,
}))

vi.mock('../../../components/report-engine/KpiGrid', () => ({
  default: () => <div data-testid="kpi-grid">kpi-grid</div>,
}))

vi.mock('../components/ReportPrintPreview', () => ({
  buildReportPrintPreviewModel: vi.fn(() => ({
    orientation: 'portrait',
    report: { name: 'Income Statement', reportCategory: 'Accounts' },
    filters: { dateFrom: '2026-08-01', dateTo: '2026-08-31' },
    generatedBy: 'Nabila',
    validation: { valid: true, errors: [], warnings: [] },
    signatures: { preparedBy: 'Nabila', reviewedBy: '-', approvedBy: '-', printedBy: 'Nabila' },
    tabular: { fields: [], rows: [] },
  })),
  default: ({ model }: any) => (
    <div data-testid="print-preview">print-preview-{model.orientation}</div>
  ),
}))

describe('DynamicReportPage print integration', () => {
  it('renders screen and print sections with print preview wired', () => {
    mockUseDynamicReport.mockReturnValue({
      definition: {
        department: { name: 'Accounts' },
        report: { title: 'Income Statement', reportCode: 'IS-001' },
        fields: [],
      },
      data: {
        rows: [{ amount: 10 }],
        summary: { revenue: 1000 },
        comparisonSummary: { enabled: false },
      },
      filters: { start_date: '2026-08-01', end_date: '2026-08-31' },
      reportFilters: [],
      setFilters: vi.fn(),
      loading: false,
    })

    const html = renderToStaticMarkup(
      <DynamicReportPage
        role="ACCOUNTANT"
        company={{ name: 'Aura Stay Hotel', address: 'Dhaka' }}
        userName="Nabila"
      />,
    )

    expect(html).toContain('screen-only')
    expect(html).toContain('print-only')
    expect(html).toContain('data-testid="print-preview"')
    expect(html).toContain('print-preview-portrait')
    expect(html).toContain('Income Statement')
  })
})
