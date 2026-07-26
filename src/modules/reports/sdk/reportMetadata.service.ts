import { supabase } from '../../../lib/supabase'
import { getReportByRoute } from '../../../lib/reporting/reportConfig'

const COMPARISON_FILTER_OPTIONS =
  'Off,Previous Period,Previous Month,Previous Quarter,Previous Year'

function cloneFilters(filters = {}) {
  return { ...filters }
}

function stripComparisonOnlyFilters(filters = {}) {
  const next = cloneFilters(filters)
  delete next.compare_to
  return next
}

function toUtcDate(value) {
  if (!value) return null
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

function formatUtcDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function shiftDate(value, unit, amount) {
  const date = toUtcDate(value)
  if (!date) return null

  const shifted = new Date(date)
  if (unit === 'day') shifted.setUTCDate(shifted.getUTCDate() + amount)
  if (unit === 'month') shifted.setUTCMonth(shifted.getUTCMonth() + amount)
  if (unit === 'year') shifted.setUTCFullYear(shifted.getUTCFullYear() + amount)
  return formatUtcDate(shifted)
}

function getComparisonMode(value) {
  const normalized = String(value || '').trim()
  if (!normalized || /^(off|none|no|false)$/i.test(normalized)) return null
  return normalized
}

function getRangeFromFilters(filters = {}) {
  const start =
    filters.start_date || filters.startDate || filters.date_from || filters.dateFrom || filters.from
  const end =
    filters.end_date || filters.endDate || filters.date_to || filters.dateTo || filters.to || start
  if (!start || !end) return null
  const startDate = toUtcDate(start)
  const endDate = toUtcDate(end)
  if (!startDate || !endDate) return null
  return { start, end, startDate, endDate }
}

function getShiftedComparisonRange(range, compareMode) {
  if (!range || !compareMode) return null

  const mode = compareMode.toLowerCase()
  if (mode === 'previous month') {
    return {
      start_date: shiftDate(range.start, 'month', -1),
      end_date: shiftDate(range.end, 'month', -1),
    }
  }
  if (mode === 'previous quarter') {
    return {
      start_date: shiftDate(range.start, 'month', -3),
      end_date: shiftDate(range.end, 'month', -3),
    }
  }
  if (mode === 'previous year') {
    return {
      start_date: shiftDate(range.start, 'year', -1),
      end_date: shiftDate(range.end, 'year', -1),
    }
  }

  const inclusiveDays = Math.max(
    1,
    Math.round((range.endDate.getTime() - range.startDate.getTime()) / 86400000) + 1,
  )
  return {
    start_date: shiftDate(range.start, 'day', -inclusiveDays),
    end_date: shiftDate(range.end, 'day', -inclusiveDays),
  }
}

function periodLabel(startDate, endDate) {
  if (!startDate || !endDate) return 'Selected Period'
  return `${startDate} to ${endDate}`
}

async function executeReport(department, slug, filters) {
  const { data, error } = await supabase.rpc('aeds_run_report', {
    p_department_slug: department,
    p_report_slug: slug,
    p_filters: filters,
  })

  if (!error && data) return data
  return null
}

const FALLBACK_GROUPS = [
  {
    department: { code: 'ACCOUNTS', name: 'Accounts', slug: 'accounts' },
    reports: [
      {
        reportCode: 'RPT-001',
        title: 'Accounts Payable Aging',
        slug: 'accounts-payable-aging',
        route: '/reports/accounts/accounts-payable-aging',
        description: 'Vendor payable aging with current, 30, 60, 90+ buckets.',
      },
      {
        reportCode: 'RPT-002',
        title: 'Accounts Receivable Aging',
        slug: 'accounts-receivable-aging',
        route: '/reports/accounts/accounts-receivable-aging',
        description: 'Guest, company and agent receivable aging.',
      },
      {
        reportCode: 'RPT-003',
        title: 'Balance Sheet',
        slug: 'balance-sheet',
        route: '/reports/accounts/balance-sheet',
        description: 'Assets, liabilities and equity statement.',
      },
      {
        reportCode: 'RPT-004',
        title: 'Bank Book',
        slug: 'bank-book',
        route: '/reports/accounts/bank-book',
        description: 'Bank-wise receipts, payments and running balance.',
      },
      {
        reportCode: 'RPT-011',
        title: 'Ledger',
        slug: 'ledger',
        route: '/reports/accounts/ledger',
        description: 'Account-wise debit, credit and running balance.',
      },
      {
        reportCode: 'RPT-013',
        title: 'Profit & Loss Statement',
        slug: 'profit-and-loss-statement',
        route: '/reports/accounts/profit-and-loss-statement',
        description: 'IFRS-aware revenue, cost, expenses and profit analysis.',
      },
      {
        reportCode: 'RPT-014',
        title: 'Trial Balance',
        slug: 'trial-balance',
        route: '/reports/accounts/trial-balance',
        description: 'Chart of accounts debit, credit and balance summary.',
      },
    ],
  },
  {
    department: { code: 'INVENTORY', name: 'Inventory', slug: 'inventory' },
    reports: [
      {
        reportCode: 'RPT-018',
        title: 'Item Wise Stock',
        slug: 'item-wise-stock',
        route: '/reports/inventory/item-wise-stock',
        description: 'Item-wise stock balance and movement.',
      },
      {
        reportCode: 'RPT-023',
        title: 'Purchase Report',
        slug: 'purchase',
        route: '/reports/inventory/purchase',
        description: 'Purchase summary by vendor and item.',
      },
    ],
  },
  {
    department: { code: 'RESTAURANT', name: 'Restaurant POS', slug: 'restaurant' },
    reports: [
      {
        reportCode: 'RPT-038',
        title: 'Sales Report',
        slug: 'sales',
        route: '/reports/restaurant/sales',
        description: 'Restaurant/POS sales summary.',
      },
      {
        reportCode: 'RPT-040',
        title: 'Void & Discount',
        slug: 'void-and-discount',
        route: '/reports/restaurant/void-and-discount',
        description: 'Void, discount and manager override tracking.',
      },
    ],
  },
]

function fallbackDefinition(department, slug) {
  if (department === 'admin' && slug === 'multi-property-consolidated-performance') {
    return {
      department: { code: 'ADMIN', name: 'Admin & Audit', slug: 'admin' },
      report: {
        reportCode: 'RPT-032',
        title: 'Multi Property Consolidated Performance',
        slug: 'multi-property-consolidated-performance',
        route: '/reports/admin/multi-property-consolidated-performance',
        description: 'Consolidated hospitality performance across properties.',
        supportsPrint: true,
        supportsExportPdf: true,
        supportsExportExcel: true,
        supportsSchedule: false,
      },
      fields: [
        {
          fieldKey: 'property_name',
          label: 'Property',
          dataType: 'Text',
          alignment: 'left',
          sortable: true,
          filterable: true,
        },
        {
          fieldKey: 'occupancy_rate',
          label: 'Occupancy %',
          dataType: 'Percent',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'adr',
          label: 'ADR',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'revpar',
          label: 'RevPAR',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'room_revenue',
          label: 'Room Revenue',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'gop',
          label: 'GOP',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'ebitda',
          label: 'EBITDA',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'net_profit',
          label: 'Net Profit',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'working_capital',
          label: 'Working Capital',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
      ],
      filters: [
        {
          filterKey: 'cycle',
          label: 'Cycle',
          filterType: 'cycle',
          sourceOptions: 'Monthly,Quarterly,Yearly,Custom Date Range',
          defaultValue: 'Monthly',
        },
        {
          filterKey: 'property',
          label: 'Property',
          filterType: 'Dropdown',
          sourceOptions: 'All Properties',
          defaultValue: 'All Properties',
        },
        { filterKey: 'start_date', label: 'Start Date', filterType: 'date' },
        { filterKey: 'end_date', label: 'End Date', filterType: 'date' },
      ],
      actions: [
        { actionKey: 'print', label: 'Print' },
        { actionKey: 'export_pdf', label: 'Export PDF' },
        { actionKey: 'export_excel', label: 'Export Excel' },
      ],
    }
  }

  const template = getReportByRoute(department, slug)
  if (template) {
    return {
      department: {
        code: String(template.departmentSlug || department || 'REPORTS').toUpperCase(),
        name: template.department || 'Reports',
        slug: template.departmentSlug || department || 'reports',
      },
      report: {
        reportCode: template.reportCode,
        title: template.title,
        slug: template.slug,
        route: template.route,
        description: template.description,
        supportsPrint: true,
        supportsExportPdf: true,
        supportsExportExcel: true,
        supportsSchedule: false,
      },
      fields: fallbackFieldsBySlug(slug) || [
        {
          fieldKey: 'transaction_date',
          label: 'Date',
          dataType: 'Date',
          alignment: 'left',
          sortable: true,
          filterable: true,
        },
        {
          fieldKey: 'reference_no',
          label: 'Reference No',
          dataType: 'Text',
          alignment: 'left',
          sortable: true,
        },
        {
          fieldKey: 'account_name',
          label: 'Account',
          dataType: 'Text',
          alignment: 'left',
          sortable: true,
          filterable: true,
        },
        { fieldKey: 'particulars', label: 'Particulars', dataType: 'Text', alignment: 'left' },
        {
          fieldKey: 'debit',
          label: 'Debit',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'credit',
          label: 'Credit',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'balance',
          label: 'Balance',
          dataType: 'Currency-BDT',
          alignment: 'right',
          aggregation: 'SUM',
          sortable: true,
        },
        {
          fieldKey: 'status',
          label: 'Status',
          dataType: 'Text',
          alignment: 'left',
          sortable: true,
        },
      ],
      filters: [
        {
          filterKey: 'cycle',
          label: 'Cycle',
          filterType: 'cycle',
          sourceOptions: 'Daily,Weekly,Monthly,Quarterly,Half-Yearly,Yearly,Custom Date Range',
          defaultValue: 'Monthly',
        },
        { filterKey: 'start_date', label: 'Start Date', filterType: 'date' },
        { filterKey: 'end_date', label: 'End Date', filterType: 'date' },
        {
          filterKey: 'compare_to',
          label: 'Compare To',
          filterType: 'Dropdown',
          sourceOptions: COMPARISON_FILTER_OPTIONS,
          defaultValue: 'Previous Period',
        },
      ],
      actions: [
        { actionKey: 'print', label: 'Print' },
        { actionKey: 'export_pdf', label: 'Export PDF' },
        { actionKey: 'export_excel', label: 'Export Excel' },
      ],
    }
  }

  const all = FALLBACK_GROUPS.flatMap((group) =>
    group.reports.map((report) => ({ ...report, department: group.department })),
  )
  const found =
    all.find((item) => item.department.slug === department && item.slug === slug) || all[0]

  return {
    department: found.department,
    report: {
      ...found,
      supportsPrint: true,
      supportsExportPdf: true,
      supportsExportExcel: true,
      supportsSchedule: false,
    },
    fields: [
      {
        fieldKey: 'transaction_date',
        label: 'Date',
        dataType: 'Date',
        alignment: 'left',
        sortable: true,
        filterable: true,
      },
      {
        fieldKey: 'reference_no',
        label: 'Reference No',
        dataType: 'Text',
        alignment: 'left',
        sortable: true,
      },
      {
        fieldKey: 'account_name',
        label: 'Account',
        dataType: 'Text',
        alignment: 'left',
        sortable: true,
        filterable: true,
      },
      { fieldKey: 'particulars', label: 'Particulars', dataType: 'Text', alignment: 'left' },
      {
        fieldKey: 'debit',
        label: 'Debit',
        dataType: 'Currency-BDT',
        alignment: 'right',
        aggregation: 'SUM',
        sortable: true,
      },
      {
        fieldKey: 'credit',
        label: 'Credit',
        dataType: 'Currency-BDT',
        alignment: 'right',
        aggregation: 'SUM',
        sortable: true,
      },
      {
        fieldKey: 'balance',
        label: 'Balance',
        dataType: 'Currency-BDT',
        alignment: 'right',
        aggregation: 'SUM',
        sortable: true,
      },
      { fieldKey: 'status', label: 'Status', dataType: 'Text', alignment: 'left', sortable: true },
    ],
    filters: [
      {
        filterKey: 'cycle',
        label: 'Cycle',
        filterType: 'cycle',
        sourceOptions: 'Daily,Weekly,Monthly,Quarterly,Half-Yearly,Yearly,Custom Date Range',
        defaultValue: 'Monthly',
      },
      { filterKey: 'start_date', label: 'Start Date', filterType: 'date' },
      { filterKey: 'end_date', label: 'End Date', filterType: 'date' },
      {
        filterKey: 'compare_to',
        label: 'Compare To',
        filterType: 'Dropdown',
        sourceOptions: COMPARISON_FILTER_OPTIONS,
        defaultValue: 'Previous Period',
      },
    ],
    actions: [
      { actionKey: 'print', label: 'Print' },
      { actionKey: 'export_pdf', label: 'Export PDF' },
      { actionKey: 'export_excel', label: 'Export Excel' },
    ],
  }
}

function fallbackFieldsBySlug(slug) {
  const bySlug = {
    'item-wise-stock': [
      {
        fieldKey: 'item_name',
        label: 'Item',
        dataType: 'Text',
        alignment: 'left',
        sortable: true,
        filterable: true,
      },
      { fieldKey: 'unit', label: 'Unit', dataType: 'Text', alignment: 'left', sortable: true },
      {
        fieldKey: 'opening_qty',
        label: 'Opening Qty',
        dataType: 'Number',
        alignment: 'right',
        aggregation: 'SUM',
        sortable: true,
      },
      {
        fieldKey: 'received_qty',
        label: 'Received Qty',
        dataType: 'Number',
        alignment: 'right',
        aggregation: 'SUM',
        sortable: true,
      },
      {
        fieldKey: 'issued_qty',
        label: 'Issued Qty',
        dataType: 'Number',
        alignment: 'right',
        aggregation: 'SUM',
        sortable: true,
      },
      {
        fieldKey: 'closing_qty',
        label: 'Closing Qty',
        dataType: 'Number',
        alignment: 'right',
        aggregation: 'SUM',
        sortable: true,
      },
    ],
  }

  return bySlug[slug] || null
}

export async function loadReportMetadata(role = 'FRONT_OFFICE') {
  try {
    const { data, error } = await supabase.rpc('aeds_report_metadata', { p_role: role })
    if (!error && Array.isArray(data) && data.length) return data
  } catch {
    // fallback below
  }
  return FALLBACK_GROUPS
}

export async function loadReportDefinition(department, slug, role = 'FRONT_OFFICE') {
  const fallback = fallbackDefinition(department, slug)
  const slugFallbackFields = fallbackFieldsBySlug(slug)
  const canonicalTemplate = getReportByRoute(department, slug)

  try {
    const { data, error } = await supabase.rpc('aeds_report_definition', {
      p_department_slug: department,
      p_report_slug: slug,
      p_role: role,
    })
    if (!error && data) {
      const canonicalReport = canonicalTemplate
        ? {
            reportCode: canonicalTemplate.reportCode,
            title: canonicalTemplate.title,
            slug: canonicalTemplate.slug,
            route: canonicalTemplate.route,
            description: canonicalTemplate.description,
          }
        : null

      return {
        ...fallback,
        ...data,
        department: canonicalTemplate
          ? {
              code: String(
                canonicalTemplate.departmentSlug || department || 'REPORTS',
              ).toUpperCase(),
              name: canonicalTemplate.department || fallback.department?.name || 'Reports',
              slug:
                canonicalTemplate.departmentSlug ||
                department ||
                fallback.department?.slug ||
                'reports',
            }
          : data.department || fallback.department,
        report: {
          ...(data.report || fallback.report || {}),
          ...(canonicalReport || {}),
        },
        fields:
          Array.isArray(data.fields) && data.fields.length
            ? data.fields
            : slugFallbackFields || fallback.fields,
        filters: (() => {
          const resolvedFilters =
            Array.isArray(data.filters) && data.filters.length ? data.filters : fallback.filters
          return resolvedFilters.some((filter) => filter.filterKey === 'compare_to')
            ? resolvedFilters
            : [
                ...resolvedFilters,
                {
                  filterKey: 'compare_to',
                  label: 'Compare To',
                  filterType: 'Dropdown',
                  sourceOptions: COMPARISON_FILTER_OPTIONS,
                  defaultValue: 'Previous Period',
                },
              ]
        })(),
        actions:
          Array.isArray(data.actions) && data.actions.length ? data.actions : fallback.actions,
      }
    }
  } catch {
    // fallback below
  }
  return {
    ...fallback,
    fields: slugFallbackFields || fallback.fields,
  }
}

export async function searchFilterOptions(sourceHint, search = '', tenantId) {
  if (!tenantId) return []
  try {
    const { data, error } = await supabase.rpc('aeds_filter_options', {
      p_source_hint: sourceHint,
      p_search: search,
      p_tenant_id: tenantId,
    })
    if (!error && Array.isArray(data)) return data
    return []
  } catch {
    return []
  }
}

export async function runMetadataReport(department, slug, filters, tenantId) {
  if (!tenantId) {
    return { rows: [], summary: { error: 'missing tenant context' } }
  }
  const reportFilters = stripComparisonOnlyFilters(filters)
  const comparisonMode = getComparisonMode(filters?.compare_to)
  const range = getRangeFromFilters(reportFilters)
  const comparisonRange = getShiftedComparisonRange(range, comparisonMode)

  try {
    const currentData = await executeReport(department, slug, reportFilters)
    if (!currentData) throw new Error('report engine unavailable')

    if (!comparisonRange || !comparisonMode) {
      return {
        ...currentData,
        comparisonRows: [],
        comparisonSummary: {
          enabled: false,
          compareTo: comparisonMode || 'Off',
          currentPeriodLabel: periodLabel(
            reportFilters.start_date || range?.start,
            reportFilters.end_date || range?.end,
          ),
          previousPeriodLabel: '',
        },
      }
    }

    const comparisonData = await executeReport(department, slug, {
      ...reportFilters,
      ...comparisonRange,
    })

    return {
      ...currentData,
      comparisonRows: comparisonData?.rows || [],
      comparisonSummary: {
        enabled: true,
        compareTo: comparisonMode,
        currentPeriodLabel: periodLabel(
          reportFilters.start_date || range?.start,
          reportFilters.end_date || range?.end,
        ),
        previousPeriodLabel: periodLabel(comparisonRange.start_date, comparisonRange.end_date),
      },
    }
  } catch {
    // fallback below
  }

  return {
    rows: [],
    summary: { error: 'report engine unavailable' },
    comparisonRows: [],
    comparisonSummary: {
      enabled: false,
      compareTo: 'Off',
      currentPeriodLabel: 'Selected Period',
      previousPeriodLabel: '',
    },
  }
}
