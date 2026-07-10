import { supabase } from "../../../supabase"

const FALLBACK_GROUPS = [
  {
    department: { code: "ACCOUNTS", name: "Accounts", slug: "accounts" },
    reports: [
      { reportCode: "RPT-001", title: "Accounts Payable Aging", slug: "accounts-payable-aging", route: "/reports/accounts/accounts-payable-aging", description: "Vendor payable aging with current, 30, 60, 90+ buckets." },
      { reportCode: "RPT-002", title: "Accounts Receivable Aging", slug: "accounts-receivable-aging", route: "/reports/accounts/accounts-receivable-aging", description: "Guest, company and agent receivable aging." },
      { reportCode: "RPT-003", title: "Balance Sheet", slug: "balance-sheet", route: "/reports/accounts/balance-sheet", description: "Assets, liabilities and equity statement." },
      { reportCode: "RPT-011", title: "Ledger", slug: "ledger", route: "/reports/accounts/ledger", description: "Account-wise debit, credit and running balance." },
      { reportCode: "RPT-013", title: "Profit & Loss Statement", slug: "profit-and-loss-statement", route: "/reports/accounts/profit-and-loss-statement", description: "IFRS-aware revenue, cost, expenses and profit analysis." },
      { reportCode: "RPT-014", title: "Trial Balance", slug: "trial-balance", route: "/reports/accounts/trial-balance", description: "Chart of accounts debit, credit and balance summary." },
    ],
  },
  {
    department: { code: "INVENTORY", name: "Inventory", slug: "inventory" },
    reports: [
      { reportCode: "RPT-018", title: "Item Wise Stock", slug: "item-wise-stock", route: "/reports/inventory/item-wise-stock", description: "Item-wise stock balance and movement." },
      { reportCode: "RPT-023", title: "Purchase Report", slug: "purchase", route: "/reports/inventory/purchase", description: "Purchase summary by vendor and item." },
    ],
  },
  {
    department: { code: "RESTAURANT", name: "Restaurant POS", slug: "restaurant" },
    reports: [
      { reportCode: "RPT-038", title: "Sales Report", slug: "sales", route: "/reports/restaurant/sales", description: "Restaurant/POS sales summary." },
      { reportCode: "RPT-040", title: "Void & Discount", slug: "void-and-discount", route: "/reports/restaurant/void-and-discount", description: "Void, discount and manager override tracking." },
    ],
  },
]

function fallbackDefinition(department, slug) {
  const all = FALLBACK_GROUPS.flatMap((group) =>
    group.reports.map((report) => ({ ...report, department: group.department }))
  )
  const found = all.find((item) => item.department.slug === department && item.slug === slug) || all[0]

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
      { fieldKey: "transaction_date", label: "Date", dataType: "Date", alignment: "left", sortable: true, filterable: true },
      { fieldKey: "reference_no", label: "Reference No", dataType: "Text", alignment: "left", sortable: true },
      { fieldKey: "account_name", label: "Account", dataType: "Text", alignment: "left", sortable: true, filterable: true },
      { fieldKey: "particulars", label: "Particulars", dataType: "Text", alignment: "left" },
      { fieldKey: "debit", label: "Debit", dataType: "Currency-BDT", alignment: "right", aggregation: "SUM", sortable: true },
      { fieldKey: "credit", label: "Credit", dataType: "Currency-BDT", alignment: "right", aggregation: "SUM", sortable: true },
      { fieldKey: "balance", label: "Balance", dataType: "Currency-BDT", alignment: "right", aggregation: "SUM", sortable: true },
      { fieldKey: "status", label: "Status", dataType: "Text", alignment: "left", sortable: true },
    ],
    filters: [
      { filterKey: "cycle", label: "Cycle", filterType: "cycle", sourceOptions: "Daily,Weekly,Monthly,Quarterly,Half-Yearly,Yearly,Custom Date Range", defaultValue: "Monthly" },
      { filterKey: "start_date", label: "Start Date", filterType: "date" },
      { filterKey: "end_date", label: "End Date", filterType: "date" },
    ],
    actions: [
      { actionKey: "print", label: "Print" },
      { actionKey: "export_pdf", label: "Export PDF" },
      { actionKey: "export_excel", label: "Export Excel" },
    ],
  }
}

function fallbackFieldsBySlug(slug) {
  const bySlug = {
    "item-wise-stock": [
      { fieldKey: "item_name", label: "Item", dataType: "Text", alignment: "left", sortable: true, filterable: true },
      { fieldKey: "unit", label: "Unit", dataType: "Text", alignment: "left", sortable: true },
      { fieldKey: "opening_qty", label: "Opening Qty", dataType: "Number", alignment: "right", aggregation: "SUM", sortable: true },
      { fieldKey: "received_qty", label: "Received Qty", dataType: "Number", alignment: "right", aggregation: "SUM", sortable: true },
      { fieldKey: "issued_qty", label: "Issued Qty", dataType: "Number", alignment: "right", aggregation: "SUM", sortable: true },
      { fieldKey: "closing_qty", label: "Closing Qty", dataType: "Number", alignment: "right", aggregation: "SUM", sortable: true },
    ],
  }

  return bySlug[slug] || null
}

export async function loadReportMetadata(role = "FRONT_OFFICE") {
  try {
    const { data, error } = await supabase.rpc("aeds_report_metadata", { p_role: role })
    if (!error && Array.isArray(data) && data.length) return data
  } catch {
    // fallback below
  }
  return FALLBACK_GROUPS
}

export async function loadReportDefinition(department, slug, role = "FRONT_OFFICE") {
  const fallback = fallbackDefinition(department, slug)
  const slugFallbackFields = fallbackFieldsBySlug(slug)

  try {
    const { data, error } = await supabase.rpc("aeds_report_definition", {
      p_department_slug: department,
      p_report_slug: slug,
      p_role: role,
    })
    if (!error && data) {
      return {
        ...fallback,
        ...data,
        fields: Array.isArray(data.fields) && data.fields.length
          ? data.fields
          : (slugFallbackFields || fallback.fields),
        filters: Array.isArray(data.filters) && data.filters.length ? data.filters : fallback.filters,
        actions: Array.isArray(data.actions) && data.actions.length ? data.actions : fallback.actions,
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

export async function runMetadataReport(department, slug, filters) {
  try {
    const { data, error } = await supabase.rpc("aeds_run_report", {
      p_department_slug: department,
      p_report_slug: slug,
      p_filters: filters,
    })
    if (!error && data) return data
  } catch {
    // fallback below
  }

  return {
    rows: [
      { transaction_date: "2026-07-05", reference_no: "JV-0001", account_name: "Cash", particulars: "Opening balance", debit: 25000, credit: 0, balance: 25000, status: "Posted" },
      { transaction_date: "2026-07-05", reference_no: "JV-0002", account_name: "Room Revenue", particulars: "Room sales posted", debit: 0, credit: 18000, balance: 7000, status: "Posted" },
      { transaction_date: "2026-07-05", reference_no: "JV-0003", account_name: "Restaurant Revenue", particulars: "POS sales posted", debit: 0, credit: 7200, balance: -200, status: "Posted" },
    ],
    summary: { demoMode: true },
  }
}
