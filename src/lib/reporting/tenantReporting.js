import { supabase } from '../../lib/supabase'
import { getTenantId } from '../tenant'
import { REPORT_TEMPLATES } from './reportConfig'

const ROLE_CATEGORY_ACCESS = {
  SUPERUSER: null,
  ADMIN: null,
  MANAGER: null,
  ACCOUNTS: ['accounts', 'inventory', 'admin'],
  FRONT_OFFICE: ['sales', 'accounts'],
  RESTAURANT: ['restaurant', 'inventory'],
  STORE: ['inventory'],
  HR: ['sales', 'admin'],
  HOUSEKEEPING: ['housekeeping', 'sales'],
}

function canSeeCategory(role, category) {
  const allowed = ROLE_CATEGORY_ACCESS[role]
  if (!allowed) return true
  return allowed.includes(category)
}

function normalizeReport(report) {
  const departmentSlug = report.departmentSlug || report.category || 'reports'
  const slug = report.slug || String(report.name || report.code)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return {
    ...report,
    category: departmentSlug,
    departmentSlug,
    slug,
    route: report.route || `/reports/${departmentSlug}/${slug}`,
  }
}

export function getRoleDefaultReportCatalog(role = 'FRONT_OFFICE') {
  return REPORT_TEMPLATES
    .map(normalizeReport)
    .filter((report) => canSeeCategory(role, report.category))
}

export async function loadTenantReportCatalog({ role = 'FRONT_OFFICE' } = {}) {
  try {
    const { data, error } = await supabase
      .from('report_role_access')
      .select('can_view, can_export, can_print, role, report_catalog(report_code)')
      .eq('role', role)

    if (error || !data) return getRoleDefaultReportCatalog(role)

    const accessByCode = new Map(
      data
        .map((row) => [row.report_catalog?.report_code, row])
        .filter(([code]) => code)
    )

    return getRoleDefaultReportCatalog(role)
      .filter((report) => {
        const access = accessByCode.get(report.code)
        return access ? access.can_view !== false : true
      })
      .map((report) => {
        const access = accessByCode.get(report.code)
        return {
          ...report,
          exportPermission: access ? !!access.can_export : report.exportPermission,
          printPermission: access ? !!access.can_print : report.printPermission,
        }
      })
  } catch {
    return getRoleDefaultReportCatalog(role)
  }
}

async function getReportTemplateId(reportCode) {
  const { data } = await supabase
    .from('report_catalog')
    .select('id')
    .eq('report_code', reportCode)
    .maybeSingle()

  return data?.id || null
}

export async function logReportExport({ report, format, filters, userId, userName }) {
  const tenantId = getTenantId()
  const reportId = await getReportTemplateId(report.code)

  await supabase.from('report_export_logs').insert({
    tenant_id: tenantId,
    report_id: reportId,
    report_code: report.code,
    export_format: format,
    filters,
    generated_by: userId || null,
    generated_by_name: userName || null,
  })
}

export async function logReportPrint({ report, pageSize, filters, userId, userName }) {
  const tenantId = getTenantId()
  const reportId = await getReportTemplateId(report.code)

  await supabase.from('report_print_logs').insert({
    tenant_id: tenantId,
    report_id: reportId,
    report_code: report.code,
    page_size: pageSize,
    filters,
    printed_by: userId || null,
    printed_by_name: userName || null,
  })
}

export function getTenantReportContext(company, role) {
  return {
    tenantId: getTenantId(),
    tenantName: company?.name || 'Tenant',
    propertyName: company?.property_name || company?.name || 'Property',
    role,
    currency: company?.currency || 'BDT',
  }
}
