import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { REPORT_TEMPLATES } from '../src/lib/reporting/reportConfig.js'

for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(process.cwd(), envFile)
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false })
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const accessToken = process.env.REPORT_ACCESS_TOKEN

if (!supabaseUrl || !supabaseAnonKey || !accessToken) {
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or REPORT_ACCESS_TOKEN')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
})

const expected = [...REPORT_TEMPLATES].sort((a, b) =>
  String(a.reportCode).localeCompare(String(b.reportCode), undefined, { numeric: true }),
)

const checks = []
for (const report of expected) {
  const { data, error } = await supabase.rpc('aeds_run_report', {
    p_department_slug: report.departmentSlug,
    p_report_slug: report.slug,
    p_filters: {
      cycle: 'Monthly',
      start_date: '2026-07-01',
      end_date: '2026-07-27',
      compare_to: 'Off',
    },
  })

  if (error) {
    checks.push({
      code: report.reportCode,
      title: report.title,
      department: report.department,
      departmentSlug: report.departmentSlug,
      slug: report.slug,
      status: 'missing_or_error',
      detail: error.message,
    })
    continue
  }

  const summary = data?.summary || {}
  const rows = Array.isArray(data?.rows) ? data.rows.length : 0
  const sourceFn = String(summary?.source_function || '').trim()
  const signal = [
    sourceFn,
    String(summary?.status || ''),
    String(summary?.implementation_status || ''),
    String(summary?.mode || ''),
  ]
    .join('|')
    .toLowerCase()

  const placeholder =
    signal.includes('not_implemented') ||
    signal.includes('placeholder') ||
    signal.includes('sample') ||
    signal.includes('todo') ||
    signal.includes('inline_')

  checks.push({
    code: report.reportCode,
    title: report.title,
    department: report.department,
    departmentSlug: report.departmentSlug,
    slug: report.slug,
    status: placeholder ? 'placeholder' : 'working',
    detail: `rows=${rows};source=${sourceFn || 'n/a'}`,
  })
}

const summary = {
  total: checks.length,
  working: checks.filter((x) => x.status === 'working').length,
  placeholder: checks.filter((x) => x.status === 'placeholder').length,
  missing_or_error: checks.filter((x) => x.status === 'missing_or_error').length,
}

const byDepartment = new Map()
for (const row of checks) {
  if (!byDepartment.has(row.department)) {
    byDepartment.set(row.department, {
      total: 0,
      working: 0,
      placeholder: 0,
      missing_or_error: 0,
    })
  }
  const entry = byDepartment.get(row.department)
  entry.total += 1
  entry[row.status] += 1
}

const output = []
output.push(`# Report 72 Live Audit (${new Date().toISOString().slice(0, 10)})`)
output.push('')
output.push('## Summary')
output.push(
  `total=${summary.total}, working=${summary.working}, placeholder=${summary.placeholder}, missing_or_error=${summary.missing_or_error}`,
)
output.push('')
output.push('## Department Breakdown')
for (const [department, counts] of byDepartment.entries()) {
  output.push(
    `- ${department}: total=${counts.total}, working=${counts.working}, placeholder=${counts.placeholder}, missing_or_error=${counts.missing_or_error}`,
  )
}
output.push('')
output.push('## Expected Report Master List')
output.push('| Code | Name | Department | Slug |')
output.push('|---|---|---|---|')
for (const report of expected) {
  output.push(
    `| ${report.reportCode} | ${report.title} | ${report.departmentSlug} | ${report.slug} |`,
  )
}
output.push('')
output.push('## Execution Results')
output.push('| Status | Code | Name | Department | Slug | Detail |')
output.push('|---|---|---|---|---|---|')
for (const row of checks) {
  output.push(
    `| ${row.status} | ${row.code} | ${row.title} | ${row.department} | ${row.slug} | ${row.detail} |`,
  )
}

const reportPath = path.join(
  process.cwd(),
  'reports',
  `report-audit-72-live-${new Date().toISOString().slice(0, 10)}.md`,
)
fs.writeFileSync(reportPath, output.join('\n'))

console.log(`REPORT_WRITTEN|${reportPath}`)
console.log(
  `SUMMARY|total=${summary.total}|working=${summary.working}|placeholder=${summary.placeholder}|missing_or_error=${summary.missing_or_error}`,
)
