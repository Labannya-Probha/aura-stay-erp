export function fieldsToDataGridColumns(fields = []) {
  return fields.map((field) => {
    const dataType = field.dataType || field.data_type || "text"
    const type = dataType.includes("Currency")
      ? "currency"
      : dataType.toLowerCase()

    return {
      accessorKey: field.fieldKey || field.field_key,
      header: field.label || field.fieldLabel || field.field_label,
      type,
      aggregation: field.aggregation?.toLowerCase?.(),
      align: field.alignment,
      width: field.width ? Number(field.width) : undefined,
    }
  })
}

export function filtersToFilterSchema(filters = []) {
  return filters
    .filter((filter) => !["cycle", "start_date", "end_date"].includes(filter.filterKey || filter.filter_key))
    .map((filter) => ({
      name: filter.filterKey || filter.filter_key,
      label: filter.label,
      type: filter.filterType === "select" ? "select" : filter.filterType || "text",
      options: typeof filter.sourceOptions === "string"
        ? filter.sourceOptions.split(",").map((item) => item.trim())
        : filter.source_options,
    }))
}

export function normalizeReportGroup(group) {
  return {
    department: group.department,
    reports: (group.reports || []).map((report) => ({
      ...report,
      title: report.title || report.name || report.report_name,
      slug: report.slug || report.report_slug,
      route: report.route || `/reports/${group.department?.slug}/${report.slug || report.report_slug}`,
    })),
  }
}
