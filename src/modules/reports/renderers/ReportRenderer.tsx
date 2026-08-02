import type { ReactNode } from 'react'

import FinancialStatementRenderer from './financial/FinancialStatementRenderer'

type ReportRendererProps = {
  definition?: any
  slug?: string
  data?: any
  loading?: boolean
  fallback: ReactNode
}

const FINANCIAL_STATEMENT_SLUGS = new Set([
  'profit-and-loss-statement',
  'balance-sheet',
  'cash-flow-statement',
  'statement-of-changes-in-equity',
  'changes-in-equity',
  'usali-departmental-statement',
])

function resolveRendererKey(definition: any, slug?: string) {
  const configured =
    definition?.report?.renderer ||
    definition?.report?.displayMode ||
    definition?.renderer ||
    definition?.displayMode

  if (configured) return String(configured).trim().toLowerCase()

  if (slug && FINANCIAL_STATEMENT_SLUGS.has(slug)) {
    return 'financial_statement'
  }

  return 'transaction_table'
}

export default function ReportRenderer({
  definition,
  slug,
  data,
  loading = false,
  fallback,
}: ReportRendererProps) {
  const rendererKey = resolveRendererKey(definition, slug)

  if (rendererKey === 'financial_statement' || rendererKey === 'configured_financial_statement') {
    return (
      <FinancialStatementRenderer
        report={definition?.report}
        period={data?.period || data?.summary?.period || data?.summary}
        formatting={data?.formatting || data?.summary?.formatting}
        validation={data?.validation || data?.summary?.validation}
        lines={data?.lines || data?.rows || []}
        loading={loading}
      />
    )
  }

  return <>{fallback}</>
}
