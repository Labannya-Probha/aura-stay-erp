import { supabase } from '../../lib/supabase'
import { getTenantId } from '../../lib/tenant'

const FALLBACK_GROUPS = [
  {
    department: { name: 'Accounts', slug: 'accounts' },
    reports: [
      {
        reportCode: 'RPT-011',
        title: 'Ledger',
        slug: 'ledger',
        route: '/reports/accounts/ledger',
        description: 'Account-wise ledger movement.',
      },
      {
        reportCode: 'RPT-014',
        title: 'Trial Balance',
        slug: 'trial-balance',
        route: '/reports/accounts/trial-balance',
        description: 'Debit, credit and closing balance.',
      },
    ],
  },
  {
    department: { name: 'Inventory', slug: 'inventory' },
    reports: [
      {
        reportCode: 'RPT-023',
        title: 'Purchase Report',
        slug: 'purchase',
        route: '/reports/inventory/purchase',
        description: 'Purchase by vendor and item.',
      },
    ],
  },
]

const FALLBACK_DEFINITION = {
  department: { name: 'Accounts', slug: 'accounts' },
  report: {
    reportCode: 'RPT-011',
    title: 'Ledger',
    slug: 'ledger',
    description: 'Account-wise ledger movement.',
    supportsPrint: true,
    supportsExportExcel: true,
    supportsExportPdf: true,
  },
  fields: [
    { fieldKey: 'transaction_date', label: 'Date', dataType: 'Date', alignment: 'left' },
    { fieldKey: 'reference_no', label: 'Reference No', dataType: 'Text', alignment: 'left' },
    { fieldKey: 'account_name', label: 'Account', dataType: 'Text', alignment: 'left' },
    { fieldKey: 'particulars', label: 'Particulars', dataType: 'Text', alignment: 'left' },
    {
      fieldKey: 'debit',
      label: 'Debit',
      dataType: 'Currency-BDT',
      aggregation: 'SUM',
      alignment: 'right',
    },
    {
      fieldKey: 'credit',
      label: 'Credit',
      dataType: 'Currency-BDT',
      aggregation: 'SUM',
      alignment: 'right',
    },
    {
      fieldKey: 'balance',
      label: 'Balance',
      dataType: 'Currency-BDT',
      aggregation: 'SUM',
      alignment: 'right',
    },
    { fieldKey: 'status', label: 'Status', dataType: 'status', alignment: 'left' },
  ],
  filters: [
    { filterKey: 'cycle', label: 'Cycle', filterType: 'cycle', defaultValue: 'this_month' },
    {
      filterKey: 'status',
      label: 'Status',
      filterType: 'select',
      sourceOptions: 'Posted,Draft,Pending,Cancelled',
    },
  ],
}

function shouldUseDevelopmentFallback() {
  return Boolean(import.meta.env?.DEV)
}

function toReportError(error, fallbackMessage) {
  const message =
    error?.message ||
    error?.details ||
    error?.hint ||
    fallbackMessage ||
    'Unable to load report data.'

  const next = new Error(message)
  next.code = error?.code || 'REPORT_REQUEST_FAILED'
  next.details = error?.details || null
  next.hint = error?.hint || null
  return next
}

function requireTenantId() {
  const tenantId = getTenantId()
  if (!tenantId) {
    throw toReportError(
      { code: 'TENANT_CONTEXT_MISSING' },
      'Tenant context is missing. Sign out and sign in again before running reports.',
    )
  }
  return tenantId
}

async function authFetch(path, init = {}) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token

  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  }

  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(path, {
    ...init,
    headers,
  })
}

export async function loadAedsReportCatalog(role = 'ADMIN') {
  const { data, error } = await supabase.rpc('aeds_report_metadata', { p_role: role })
  if (error) {
    if (shouldUseDevelopmentFallback()) return FALLBACK_GROUPS
    throw toReportError(error, 'Unable to load the report catalog.')
  }
  return Array.isArray(data) ? data : []
}

export async function loadAedsReportDefinition({ department, slug, role = 'ADMIN' }) {
  const { data, error } = await supabase.rpc('aeds_report_definition', {
    p_department_slug: department,
    p_report_slug: slug,
    p_role: role,
  })

  if (error) {
    if (shouldUseDevelopmentFallback()) return FALLBACK_DEFINITION
    throw toReportError(error, 'Unable to load the report definition.')
  }

  if (!data) {
    throw toReportError(
      { code: 'REPORT_ACCESS_DENIED' },
      'This report is unavailable or your role does not have access.',
    )
  }

  return data
}

export async function runAedsReport({ department, slug, filters }) {
  const tenantId = requireTenantId()
  const { data, error } = await supabase.rpc('aeds_run_report', {
    p_department_slug: department,
    p_report_slug: slug,
    p_filters: filters || {},
    p_tenant_id: tenantId,
  })

  if (error) {
    throw toReportError(error, 'Unable to run the selected report.')
  }

  if (data?.summary?.error) {
    throw toReportError(
      { code: 'REPORT_ENGINE_ERROR', message: data.summary.error },
      'The report engine rejected this request.',
    )
  }

  return {
    rows: Array.isArray(data?.rows) ? data.rows : [],
    summary: data?.summary && typeof data.summary === 'object' ? data.summary : {},
  }
}

export async function enqueueAedsReportExport({ reportCode, filters = {}, format = 'excel' }) {
  if (!reportCode) throw new Error('Report code is required for export.')

  const safeFormat = String(format || 'excel').toLowerCase()
  if (!['csv', 'excel', 'pdf'].includes(safeFormat)) {
    throw new Error(`Unsupported export format: ${safeFormat}`)
  }

  const response = await authFetch(
    `/api/reports/${encodeURIComponent(reportCode)}/export/${safeFormat}`,
    {
      method: 'POST',
      body: JSON.stringify({ filters, tenantId: requireTenantId() }),
    },
  )

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || `Failed to queue ${safeFormat} export.`)
  }

  return payload
}

export async function getAedsReportExportJob(jobId) {
  if (!jobId) throw new Error('Job id is required.')

  const response = await authFetch(`/api/reports/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to read export job status.')
  }

  return payload
}

export async function waitForAedsReportExportJob(jobId, { pollMs = 1200, maxAttempts = 120 } = {}) {
  let attempts = 0
  while (attempts < maxAttempts) {
    const status = await getAedsReportExportJob(jobId)
    if (status.status === 'completed') return status
    if (status.status === 'failed') {
      throw new Error(status.error || 'Export job failed.')
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs))
    attempts += 1
  }

  throw new Error('Export job timed out. Please try again.')
}

export async function saveAedsReportView({ reportSlug, name, filters, columns }) {
  const payload = {
    tenant_id: requireTenantId(),
    report_slug: reportSlug,
    name,
    filters,
    columns,
  }

  try {
    const { data, error } = await supabase
      .from('report_saved_views')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    if (!shouldUseDevelopmentFallback()) throw toReportError(error, 'Unable to save report view.')
    const saved = JSON.parse(localStorage.getItem('aeds.report.savedViews') || '[]')
    const next = [{ ...payload, id: Date.now() }, ...saved].slice(0, 20)
    localStorage.setItem('aeds.report.savedViews', JSON.stringify(next))
    return next[0]
  }
}

export async function loadAedsReportViews(reportSlug) {
  const tenantId = requireTenantId()
  const { data, error } = await supabase
    .from('report_saved_views')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('report_slug', reportSlug)

  if (error) {
    if (!shouldUseDevelopmentFallback()) {
      throw toReportError(error, 'Unable to load saved report views.')
    }
    return JSON.parse(localStorage.getItem('aeds.report.savedViews') || '[]').filter(
      (item) => item.report_slug === reportSlug,
    )
  }

  return data || []
}
