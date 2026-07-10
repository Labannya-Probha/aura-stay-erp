export type ReportMetadataGroup = {
  department: { code: string; name: string; slug: string; icon?: string }
  reports: any[]
}

export type ReportDefinition = {
  department: any
  report: any
  fields: any[]
  filters: any[]
  actions: any[]
}

export type ReportData = {
  rows: Record<string, any>[]
  summary: Record<string, any>
}
