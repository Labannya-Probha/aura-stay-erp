import { supabase } from "../../supabase"

const FALLBACK_GROUPS = [
  {
    department: { name: "Accounts", slug: "accounts" },
    reports: [
      { reportCode: "RPT-011", title: "Ledger", slug: "ledger", route: "/reports/accounts/ledger", description: "Account-wise ledger movement." },
      { reportCode: "RPT-014", title: "Trial Balance", slug: "trial-balance", route: "/reports/accounts/trial-balance", description: "Debit, credit and closing balance." },
    ],
  },
  {
    department: { name: "Inventory", slug: "inventory" },
    reports: [
      { reportCode: "RPT-023", title: "Purchase Report", slug: "purchase", route: "/reports/inventory/purchase", description: "Purchase by vendor and item." },
    ],
  },
]

const FALLBACK_DEFINITION = {
  department: { name: "Accounts", slug: "accounts" },
  report: {
    reportCode: "RPT-011",
    title: "Ledger",
    slug: "ledger",
    description: "Account-wise ledger movement.",
    supportsPrint: true,
    supportsExportExcel: true,
    supportsExportPdf: true,
  },
  fields: [
    { fieldKey: "transaction_date", label: "Date", dataType: "Date", alignment: "left" },
    { fieldKey: "reference_no", label: "Reference No", dataType: "Text", alignment: "left" },
    { fieldKey: "account_name", label: "Account", dataType: "Text", alignment: "left" },
    { fieldKey: "particulars", label: "Particulars", dataType: "Text", alignment: "left" },
    { fieldKey: "debit", label: "Debit", dataType: "Currency-BDT", aggregation: "SUM", alignment: "right" },
    { fieldKey: "credit", label: "Credit", dataType: "Currency-BDT", aggregation: "SUM", alignment: "right" },
    { fieldKey: "balance", label: "Balance", dataType: "Currency-BDT", aggregation: "SUM", alignment: "right" },
    { fieldKey: "status", label: "Status", dataType: "status", alignment: "left" },
  ],
  filters: [
    { filterKey: "cycle", label: "Cycle", filterType: "cycle", defaultValue: "this_month" },
    { filterKey: "status", label: "Status", filterType: "select", sourceOptions: "Posted,Draft,Pending,Cancelled" },
  ],
}

export async function loadAedsReportCatalog(role = "ADMIN") {
  try {
    const { data, error } = await supabase.rpc("aeds_report_metadata", { p_role: role })
    if (!error && Array.isArray(data) && data.length) return data
  } catch {
    // fallback below
  }
  return FALLBACK_GROUPS
}

export async function loadAedsReportDefinition({ department, slug, role = "ADMIN" }) {
  try {
    const { data, error } = await supabase.rpc("aeds_report_definition", {
      p_department_slug: department,
      p_report_slug: slug,
      p_role: role,
    })
    if (!error && data) return data
  } catch {
    // fallback below
  }
  return FALLBACK_DEFINITION
}

export async function runAedsReport({ department, slug, filters }) {
  try {
    const { data, error } = await supabase.rpc("aeds_run_report", {
      p_department_slug: department,
      p_report_slug: slug,
      p_filters: filters || {},
    })
    if (!error && data) return data
  } catch {
    // fallback below
  }

  return {
    rows: [],
    summary: { source: "fallback_empty" },
  }
}

export async function saveAedsReportView({ reportSlug, name, filters, columns }) {
  const payload = {
    report_slug: reportSlug,
    name,
    filters,
    columns,
  }

  try {
    const { data, error } = await supabase.from("report_saved_views").insert(payload).select().single()
    if (error) throw error
    return data
  } catch {
    const saved = JSON.parse(localStorage.getItem("aeds.report.savedViews") || "[]")
    const next = [{ ...payload, id: Date.now() }, ...saved].slice(0, 20)
    localStorage.setItem("aeds.report.savedViews", JSON.stringify(next))
    return next[0]
  }
}

export async function loadAedsReportViews(reportSlug) {
  try {
    const { data, error } = await supabase.from("report_saved_views").select("*").eq("report_slug", reportSlug)
    if (!error) return data || []
  } catch {
    // fallback below
  }

  return JSON.parse(localStorage.getItem("aeds.report.savedViews") || "[]").filter(
    (item) => item.report_slug === reportSlug
  )
}
