import { reportCategories, reportTemplates, sampleRows } from './reportTemplates.js'
import { supabaseAdmin } from '../middleware/auth.js'

const currencyKeys = [
  'grossAmount',
  'discount',
  'vat',
  'serviceCharge',
  'netAmount',
  'debit',
  'credit',
  'balance',
]

function hasReportAccess(user = {}, reportCode) {
  if (!user.role || ['SUPERUSER', 'ADMIN', 'MANAGER'].includes(user.role)) return true
  const allowed = user.reportCodes || []
  return allowed.includes(reportCode)
}

function filterRows(rows, filters, report) {
  return rows
    .filter((row) => {
      if (filters.dateFrom && row.transactionDate < filters.dateFrom) return false
      if (filters.dateTo && row.transactionDate > filters.dateTo) return false
      if (
        filters.department &&
        !filters.department.startsWith('All') &&
        row.department !== filters.department
      )
        return false
      if (
        filters.paymentMethod &&
        !filters.paymentMethod.startsWith('All') &&
        row.paymentMethod !== filters.paymentMethod
      )
        return false
      if (report.category === 'POS' && row.costCenter !== 'F&B') return false
      if (report.category === 'HOTEL_KPI' && row.department !== 'Rooms') return false
      return true
    })
    .map((row, index) => ({ ...row, slNo: index + 1 }))
}

function calculateTotals(rows) {
  return currencyKeys.reduce((acc, key) => {
    acc[key] = rows.reduce((sum, row) => sum + Number(row[key] || 0), 0)
    return acc
  }, {})
}

function calculateKpis(rows) {
  const totals = calculateTotals(rows)
  const roomRevenue = rows
    .filter((row) => row.department === 'Rooms')
    .reduce((sum, row) => sum + Number(row.netAmount || 0), 0)
  const restaurantRevenue = rows
    .filter((row) => row.department === 'Restaurant')
    .reduce((sum, row) => sum + Number(row.netAmount || 0), 0)
  return {
    totalRevenue: totals.netAmount,
    roomRevenue,
    restaurantRevenue,
    otherRevenue: Math.max(totals.netAmount - roomRevenue - restaurantRevenue, 0),
    occupancy: 68.5,
    adr: roomRevenue ? roomRevenue / 3 : 0,
    revpar: roomRevenue ? roomRevenue / 5 : 0,
    cashCollection: rows
      .filter((row) => row.paymentMethod === 'Cash')
      .reduce((sum, row) => sum + Number(row.netAmount || 0), 0),
    cardCollection: rows
      .filter((row) => row.paymentMethod === 'Card')
      .reduce((sum, row) => sum + Number(row.netAmount || 0), 0),
    outstandingReceivable: totals.balance,
    vatPayable: totals.vat,
    netProfit: totals.netAmount * 0.3,
    gop: totals.netAmount * 0.45,
    ebitdaMargin: totals.netAmount ? 29.9 : 0,
  }
}

function normalizeFilters(filters = {}) {
  const normalized = { ...filters }

  if (!normalized.start_date && normalized.dateFrom) normalized.start_date = normalized.dateFrom
  if (!normalized.end_date && normalized.dateTo) normalized.end_date = normalized.dateTo
  if (!normalized.as_of_date && normalized.dateTo) normalized.as_of_date = normalized.dateTo

  return normalized
}

function inferFieldType(field = {}) {
  const rawType = String(field.dataType || '').toLowerCase()
  if (rawType.includes('currency') || rawType.includes('number') || rawType.includes('percent')) {
    return 'currency'
  }
  if (rawType.includes('date')) return 'date'
  return 'text'
}

function mapDefinitionToColumns(fields = []) {
  return fields.map((field) => ({
    key: field.fieldKey,
    label: field.label,
    align: field.alignment === 'right' ? 'right' : 'left',
    type: inferFieldType(field),
    total: field.aggregation === 'SUM',
  }))
}

function calculateTotalsFromFields(fields, rows) {
  const sumFields = fields.filter((field) => field.aggregation === 'SUM')
  if (!sumFields.length) return calculateTotals(rows)

  return sumFields.reduce((acc, field) => {
    acc[field.fieldKey] = rows.reduce((sum, row) => sum + Number(row?.[field.fieldKey] || 0), 0)
    return acc
  }, {})
}

async function loadCatalogReport(reportCode, role = 'ADMIN') {
  const { data: catalogRow, error: catalogError } = await supabaseAdmin
    .from('report_catalog')
    .select(
      `
        report_code,
        title,
        slug,
        source_function,
        supports_print,
        supports_export_excel,
        supports_export_pdf,
        report_departments!inner(code,name,slug)
      `,
    )
    .eq('report_code', reportCode)
    .eq('is_active', true)
    .maybeSingle()

  if (catalogError || !catalogRow) return null

  const department = Array.isArray(catalogRow.report_departments)
    ? catalogRow.report_departments[0]
    : catalogRow.report_departments

  const departmentSlug = department?.slug
  const reportSlug = catalogRow.slug

  if (!departmentSlug || !reportSlug) return null

  const { data: definitionData } = await supabaseAdmin.rpc('aeds_report_definition', {
    p_department_slug: departmentSlug,
    p_report_slug: reportSlug,
    p_role: role || 'ADMIN',
  })

  const fields = Array.isArray(definitionData?.fields) ? definitionData.fields : []
  const columns = mapDefinitionToColumns(fields)

  return {
    reportCode: catalogRow.report_code,
    sourceFunction: catalogRow.source_function,
    fields,
    report: {
      code: catalogRow.report_code,
      name: catalogRow.title,
      category: department?.name || department?.code || 'Reporting',
      ifrsReference: null,
      exportPermission: !!catalogRow.supports_export_excel || !!catalogRow.supports_export_pdf,
      printPermission: !!catalogRow.supports_print,
      columns,
    },
  }
}

async function runLiveReport(catalogReport, filters, user) {
  if (!user?.tenantId) {
    const error = new Error('Tenant context missing for report generation.')
    error.status = 400
    throw error
  }

  if (!catalogReport.sourceFunction) {
    const error = new Error(
      `No source function mapped for report code ${catalogReport.reportCode}.`,
    )
    error.status = 500
    throw error
  }

  const normalizedFilters = normalizeFilters(filters)
  const { data, error } = await supabaseAdmin.rpc(catalogReport.sourceFunction, {
    p_tenant_id: user.tenantId,
    p_filters: normalizedFilters,
  })

  if (error) {
    const wrapped = new Error(
      `Failed to execute report source ${catalogReport.sourceFunction}: ${error.message}`,
    )
    wrapped.status = 500
    throw wrapped
  }

  const rows = Array.isArray(data?.rows) ? data.rows : []
  const totals = calculateTotalsFromFields(catalogReport.fields, rows)
  const summary = data?.summary || {}

  return {
    report: catalogReport.report,
    filters,
    rows,
    totals,
    kpis: {
      totalRevenue: Number(summary.total_revenue || totals.net_amount || totals.netAmount || 0),
      roomRevenue: Number(summary.room_revenue || 0),
      restaurantRevenue: Number(summary.restaurant_revenue || 0),
      otherRevenue: Number(summary.other_revenue || 0),
      occupancy: Number(summary.occupancy_rate || 0),
      adr: Number(summary.adr || 0),
      revpar: Number(summary.revpar || 0),
      cashCollection: Number(summary.cash_collection || 0),
      cardCollection: Number(summary.card_collection || 0),
      outstandingReceivable: Number(
        summary.total_outstanding || summary.outstanding_receivable || 0,
      ),
      vatPayable: Number(summary.vat_payable || totals.vat || 0),
      netProfit: Number(summary.net_profit || 0),
      gop: Number(summary.gop || 0),
      ebitdaMargin: Number(summary.ebitda_margin_pct || 0),
    },
    audit: {
      generatedBy: user.name || user.username || 'system',
      generatedAt: new Date().toISOString(),
      filterHash: Buffer.from(JSON.stringify(filters || {})).toString('base64url'),
    },
  }
}

export function listReports(user = {}) {
  return {
    categories: reportCategories,
    reports: reportTemplates.map((report) => ({
      code: report.code,
      name: report.name,
      category: report.category,
      ifrsReference: report.ifrsReference,
      exportPermission: report.exportPermission,
      printPermission: report.printPermission,
      canView: hasReportAccess(user, report.code),
    })),
  }
}

export function getReport(reportCode, user = {}) {
  const report = reportTemplates.find((item) => item.code === reportCode)
  if (!report) {
    const error = new Error(`Unknown report code: ${reportCode}`)
    error.status = 404
    throw error
  }
  if (!hasReportAccess(user, reportCode)) {
    const error = new Error('You do not have permission to view this report.')
    error.status = 403
    throw error
  }
  return report
}

export async function generateReport(reportCode, payload = {}, user = {}) {
  const filters = payload.filters || {}

  const catalogReport = await loadCatalogReport(reportCode, user.role)
  if (catalogReport) {
    return runLiveReport(catalogReport, filters, user)
  }

  const report = getReport(reportCode, user)
  const rows = filterRows(sampleRows, filters, report)
  const totals = calculateTotals(rows)
  const kpis = calculateKpis(rows)

  return {
    report,
    filters,
    rows,
    totals,
    kpis,
    audit: {
      generatedBy: user.name || user.username || 'system',
      generatedAt: new Date().toISOString(),
      filterHash: Buffer.from(JSON.stringify(filters)).toString('base64url'),
    },
  }
}
