import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ReportPrintPreview, { buildReportPrintPreviewModel } from './ReportPrintPreview'

describe('buildReportPrintPreviewModel', () => {
  const company = {
    name: 'Aura Stay Hotel',
    address: 'Gulshan, Dhaka',
    contact: '+8801XXXXXXXXX',
  }

  it('builds financial model with comparison and validation errors', () => {
    const definition = {
      department: { name: 'Accounts' },
      report: { title: 'Income Statement', displayMode: 'financial_statement' },
      fields: [],
    }

    const data = {
      rows: [
        { line_code: 'HDR', line_type: 'HEADER', label: 'Revenue' },
        { line_code: 'R1', label: 'Room Revenue', current_amount: 120000, comparison_amount: 95000 },
      ],
      summary: {
        currency: 'BDT',
        prepared_by: 'Finance Manager',
      },
      validation: {
        valid: false,
        errors: [{ code: 'BALANCE_MISMATCH', message: 'Trial balance mismatch.' }],
        warnings: [{ code: 'ROUNDING', message: 'Rounded values used.' }],
      },
      audit: {
        generatedBy: 'System User',
      },
    }

    const model = buildReportPrintPreviewModel({
      definition,
      data,
      filters: { start_date: '2026-08-01', end_date: '2026-08-31', compare_to: 'previous_period' },
      company,
      role: 'ACCOUNTANT',
      userName: 'Nabila',
    })

    expect(model.orientation).toBe('portrait')
    expect(model.report.name).toBe('Income Statement')
    expect(model.validation.valid).toBe(false)
    expect(model.validation.errors).toContain('Trial balance mismatch.')
    expect(model.financial?.hasComparison).toBe(true)
    expect(model.signatures.preparedBy).toBe('Finance Manager')
    expect(model.signatures.printedBy).toBe('System User')
  })

  it('builds tabular model when report is non-financial', () => {
    const definition = {
      department: { name: 'Front Office' },
      report: { title: 'Reservation Source Breakdown' },
      fields: [
        { fieldKey: 'source_name', label: 'Source', dataType: 'Text' },
        { fieldKey: 'booking_count', label: 'Bookings', dataType: 'Number', alignment: 'right' },
      ],
    }

    const data = {
      rows: [{ source_name: 'Direct', booking_count: 42 }],
      summary: {},
      validation: { valid: true, errors: [], warnings: [] },
      audit: {},
    }

    const model = buildReportPrintPreviewModel({
      definition,
      data,
      filters: { start_date: '2026-08-01', end_date: '2026-08-31' },
      company,
      role: 'MANAGER',
      userName: 'Arif',
    })

    expect(model.financial).toBeUndefined()
    expect(model.tabular?.fields).toHaveLength(2)
    expect(model.tabular?.rows).toHaveLength(1)
    expect(model.validation.valid).toBe(true)
  })
})

describe('ReportPrintPreview rendering', () => {
  const company = {
    name: 'Aura Stay Hotel',
    address: 'Gulshan, Dhaka',
    contact: '+8801XXXXXXXXX',
  }

  it('renders validation state, comparative column and signatures for financial model', () => {
    const model = {
      orientation: 'portrait' as const,
      report: { name: 'Income Statement', reportCategory: 'Accounts' },
      filters: {
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31',
        cycle: 'Monthly',
        currency: 'BDT',
        compareTo: 'previous_period',
      },
      generatedBy: 'Nabila',
      validation: {
        valid: false,
        errors: ['Trial balance mismatch.'],
        warnings: ['Rounded values used.'],
      },
      signatures: {
        preparedBy: 'Finance Manager',
        reviewedBy: 'Controller',
        approvedBy: 'GM',
        printedBy: 'Nabila',
      },
      financial: {
        hasComparison: true,
        lines: [
          {
            key: 'HDR',
            label: 'Revenue',
            indentLevel: 0,
            lineType: 'HEADER',
            isBold: true,
            isUnderlined: false,
            isDoubleUnderlined: false,
            currentAmount: 0,
            comparisonAmount: 0,
          },
          {
            key: 'L1',
            label: 'Room Revenue',
            indentLevel: 1,
            lineType: 'LINE',
            isBold: false,
            isUnderlined: false,
            isDoubleUnderlined: false,
            currentAmount: 120000,
            comparisonAmount: 100000,
          },
        ],
      },
    }

    const html = renderToStaticMarkup(<ReportPrintPreview model={model} company={company} />)

    expect(html).toContain('Validation Status: Failed')
    expect(html).toContain('Comparative')
    expect(html).toContain('Prepared By: Finance Manager')
    expect(html).toContain('Approved By: GM')
    expect(html).toContain('Room Revenue')
  })

  it('renders tabular headers/rows and validated status', () => {
    const model = {
      orientation: 'landscape' as const,
      report: { name: 'Booking Source Report', reportCategory: 'Front Office' },
      filters: {
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31',
        cycle: 'Monthly',
        currency: 'BDT',
        compareTo: 'off',
      },
      generatedBy: 'Arif',
      validation: { valid: true, errors: [], warnings: [] },
      signatures: {
        preparedBy: 'Arif',
        reviewedBy: '-',
        approvedBy: '-',
        printedBy: 'Arif',
      },
      tabular: {
        fields: [
          { fieldKey: 'source', label: 'Source', dataType: 'Text', alignment: 'left' },
          { fieldKey: 'count', label: 'Count', dataType: 'Number', alignment: 'right' },
        ],
        rows: [
          { source: 'Direct', count: 25 },
          { source: 'OTA', count: 34 },
        ],
      },
    }

    const html = renderToStaticMarkup(<ReportPrintPreview model={model} company={company} />)

    expect(html).toContain('Validation Status: Validated')
    expect(html).toContain('Source')
    expect(html).toContain('Direct')
    expect(html).toContain('OTA')
    expect(html).toContain('report-print-preview--landscape')
  })
})
