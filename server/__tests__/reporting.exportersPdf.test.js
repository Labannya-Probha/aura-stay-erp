import { describe, expect, it } from 'vitest'

import { toPdf } from '../reporting/exporters.js'

describe('reporting PDF exporters', () => {
  it('creates genuine PDF buffers for financial statements', () => {
    const pdf = toPdf({
      report: {
        code: 'RPT-IFRS-PNL',
        name: 'Statement of Profit or Loss',
        displayMode: 'financial_statement',
      },
      summary: {
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        company_name: 'Aura Stay Holdings',
        property_name: 'Novem Eco Resort',
      },
      rows: [
        {
          display_order: 1,
          line_type: 'HEADER',
          label: 'Revenue',
          indent_level: 0,
        },
        {
          display_order: 2,
          line_type: 'CALCULATED',
          label: 'Room Revenue',
          current_amount: 125000,
          comparison_amount: 120000,
          variance_amount: 5000,
          indent_level: 1,
        },
      ],
      audit: {
        generatedBy: 'finance@aura-stay.local',
        generatedAt: '2026-08-02T08:10:00.000Z',
      },
    })

    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.subarray(0, 5).toString('utf-8')).toBe('%PDF-')
    expect(pdf.byteLength).toBeGreaterThan(1000)
  })

  it('creates genuine PDF buffers for tabular operational reports', () => {
    const pdf = toPdf({
      report: {
        code: 'RPT-OPS-001',
        name: 'Operations Summary',
        columns: [
          { key: 'document_no', label: 'Document', align: 'left', type: 'text' },
          { key: 'net_amount', label: 'Net Amount', align: 'right', type: 'currency' },
          { key: 'balance', label: 'Balance', align: 'right', type: 'number' },
        ],
      },
      summary: {
        start_date: '2026-07-01',
        end_date: '2026-07-31',
      },
      rows: [
        { document_no: 'INV-1001', net_amount: 5020.55, balance: 0 },
        { document_no: 'INV-1002', net_amount: -900.5, balance: -100 },
      ],
      totals: {
        net_amount: 4120.05,
        balance: -100,
      },
      audit: {
        generatedBy: 'ops@aura-stay.local',
      },
    })

    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.subarray(0, 5).toString('utf-8')).toBe('%PDF-')
    expect(pdf.byteLength).toBeGreaterThan(1000)
  })
})
