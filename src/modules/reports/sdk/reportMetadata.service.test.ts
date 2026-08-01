import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadReportDefinition, runMetadataReport } from './reportMetadata.service'
import { supabase } from '../../../lib/supabase'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

describe('loadReportDefinition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses USALI-specific fallback fields for the departmental statement', async () => {
    ;(supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null })

    const definition = await loadReportDefinition(
      'accounts',
      'usali-departmental-statement',
      'FRONT_OFFICE',
    )

    expect(definition.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'usali_department', label: 'Department' }),
        expect.objectContaining({ fieldKey: 'usali_line_group', label: 'Line Group' }),
        expect.objectContaining({ fieldKey: 'current_period.amount', label: 'Current Period' }),
      ]),
    )
    expect(definition.report?.slug).toBe('usali-departmental-statement')
  })

  it('uses explicit fallback fields for aging, balance-sheet, depreciation, and tax-payment reports', async () => {
    ;(supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null })

    const apAging = await loadReportDefinition('accounts', 'accounts-payable-aging', 'FRONT_OFFICE')
    const arAging = await loadReportDefinition(
      'accounts',
      'accounts-receivable-aging',
      'FRONT_OFFICE',
    )
    const balanceSheet = await loadReportDefinition('accounts', 'balance-sheet', 'FRONT_OFFICE')
    const depreciation = await loadReportDefinition('accounts', 'depreciation', 'FRONT_OFFICE')
    const taxPayment = await loadReportDefinition('accounts', 'vat-tax-payment', 'FRONT_OFFICE')

    expect(apAging.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'vendor_name', label: 'Vendor' }),
        expect.objectContaining({ fieldKey: 'total_due', label: 'Total Due' }),
      ]),
    )
    expect(arAging.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'customer_name', label: 'Customer' }),
        expect.objectContaining({ fieldKey: 'total_due', label: 'Total Due' }),
      ]),
    )
    expect(balanceSheet.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'opening_amount', label: 'Opening Balance' }),
        expect.objectContaining({ fieldKey: 'current_amount', label: 'Closing Balance' }),
      ]),
    )
    expect(depreciation.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'asset_name', label: 'Asset' }),
        expect.objectContaining({ fieldKey: 'book_value', label: 'Book Value' }),
      ]),
    )
    expect(taxPayment.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'tax_type', label: 'Tax Type' }),
        expect.objectContaining({ fieldKey: 'balance_amount', label: 'Balance' }),
      ]),
    )
  })

  it('adds a method filter for cash-flow statement variants', async () => {
    ;(supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null })

    const direct = await loadReportDefinition(
      'accounts',
      'statement-of-cash-flows-direct',
      'FRONT_OFFICE',
    )
    const indirect = await loadReportDefinition(
      'accounts',
      'statement-of-cash-flows-indirect',
      'FRONT_OFFICE',
    )

    expect(direct.filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filterKey: 'method',
          filterType: 'Dropdown',
          sourceOptions: 'Direct,Indirect',
        }),
      ]),
    )

    expect(indirect.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'current_period.amount', label: 'Current Period' }),
        expect.objectContaining({ fieldKey: 'variance.amount', label: 'Variance' }),
      ]),
    )
  })

  it('normalizes legacy balance-sheet slug to statement-of-financial-position for report definition RPC', async () => {
    ;(supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        department: { slug: 'accounts', name: 'Accounts' },
        report: { reportCode: 'RPT-IFRS-BS', title: 'Statement of Financial Position' },
        fields: [],
        filters: [],
        actions: [],
      },
      error: null,
    })

    await loadReportDefinition('accounts', 'balance-sheet', 'FRONT_OFFICE')

    expect(supabase.rpc).toHaveBeenCalledWith('aeds_report_definition', {
      p_department_slug: 'accounts',
      p_report_slug: 'statement-of-financial-position',
      p_role: 'FRONT_OFFICE',
    })
  })

  it('returns structured fallback rows for balance-sheet rendering', async () => {
    ;(supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null })

    const report = await runMetadataReport('accounts', 'balance-sheet', {}, 'tenant-1')

    expect(report.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ line_code: 'BS.ASSETS', line_type: 'HEADER' }),
        expect.objectContaining({
          line_code: 'BS.CA.CASH',
          opening_amount: 2500000,
          current_amount: 3000000,
        }),
        expect.objectContaining({
          line_code: 'BS.EQ_LIAB.TOTAL',
          line_type: 'GRAND_TOTAL',
          current_amount: 3000000,
        }),
      ]),
    )
    expect(report.validation).toEqual(
      expect.objectContaining({
        valid: true,
      }),
    )
    expect(report.summary.period).toEqual(
      expect.objectContaining({
        opening_label: 'Opening Balance',
        current_label: 'Closing Balance',
      }),
    )
  })
})
