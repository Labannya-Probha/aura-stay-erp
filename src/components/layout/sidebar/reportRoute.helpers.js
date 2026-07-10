export function slugifyReportRoute(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function cleanReportRouteSlug(name) {
  return slugifyReportRoute(
    String(name || "")
      .replace(/\breport\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  )
}

export function buildAedsReportPath(report, category) {
  const departmentSlug =
    report.departmentSlug ||
    report.department_slug ||
    slugifyReportRoute(report.department || report.categoryName || category?.name || report.category || "reports")

  const reportSlug =
    report.slug ||
    report.reportSlug ||
    report.report_slug ||
    cleanReportRouteSlug(report.name || report.reportName || report.title || report.code)

  return `/reports/${departmentSlug}/${reportSlug}`
}
