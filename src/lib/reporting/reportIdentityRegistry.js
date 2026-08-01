import { REPORT_TEMPLATES } from './reportConfig'

function toReportSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseReportRoute(route) {
  const match = String(route || '').match(/^\/reports\/([^/]+)\/([^/]+)$/)
  if (!match) return null
  return { departmentSlug: match[1], reportSlug: match[2] }
}

export function buildReportRoute(departmentSlug = 'reports', reportSlug = '') {
  return `/reports/${departmentSlug}/${reportSlug}`
}

export function getReportIdentity(departmentSlug, reportSlug) {
  return (
    REPORT_TEMPLATES.find(
      (report) => report.departmentSlug === departmentSlug && report.slug === reportSlug,
    ) || null
  )
}

export function getReportIdentityByCode(code) {
  const normalized = String(code || '').trim()
  if (!normalized) return null
  return (
    REPORT_TEMPLATES.find(
      (report) => report.code === normalized || report.reportCode === normalized,
    ) || null
  )
}

export function resolveReportIdentity(report = {}, { departmentSlug } = {}) {
  const routeIdentity = parseReportRoute(report.route)
  const resolvedDepartmentSlug =
    departmentSlug || report.departmentSlug || report.category || routeIdentity?.departmentSlug || 'reports'
  const resolvedSlug =
    report.slug ||
    report.report_slug ||
    routeIdentity?.reportSlug ||
    toReportSlug(report.title || report.name || report.report_name || report.code || report.reportCode)

  const byCode = getReportIdentityByCode(report.reportCode || report.report_code || report.code)
  if (
    byCode &&
    (!resolvedDepartmentSlug || byCode.departmentSlug === resolvedDepartmentSlug) &&
    (!resolvedSlug || byCode.slug === resolvedSlug || !report.slug)
  ) {
    return byCode
  }

  const byRoute = getReportIdentity(resolvedDepartmentSlug, resolvedSlug)
  if (byRoute) return byRoute

  const reportCode = report.reportCode || report.report_code || report.code || null
  return {
    ...report,
    category: resolvedDepartmentSlug,
    departmentSlug: resolvedDepartmentSlug,
    slug: resolvedSlug,
    route: report.route || buildReportRoute(resolvedDepartmentSlug, resolvedSlug),
    title: report.title || report.name || report.report_name || resolvedSlug,
    code: report.code || reportCode,
    reportCode,
  }
}
