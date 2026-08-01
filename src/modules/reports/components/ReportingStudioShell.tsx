import type { ReactNode } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { cn } from '../../../lib/utils'

type ReportingStudioShellProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  summary?: ReactNode
  comparison?: ReactNode
  filters?: ReactNode
  loading?: boolean
  empty?: boolean
  error?: string | null
  onRefresh?: () => void
  refreshing?: boolean
  children: ReactNode
  className?: string
}

export default function ReportingStudioShell({
  title,
  subtitle,
  eyebrow = 'Reporting Studio',
  actions,
  summary,
  comparison,
  filters,
  loading = false,
  empty = false,
  error,
  onRefresh,
  refreshing = false,
  children,
  className,
}: ReportingStudioShellProps) {
  if (loading) {
    return (
      <LoadingState
        variant="container"
        label={`Loading ${title}`}
        description="Building comparative reporting view."
        className={className}
      />
    )
  }

  if (empty) {
    return (
      <EmptyState
        variant="container"
        title={`No data for ${title}`}
        description={subtitle || 'Try another date range, branch or department.'}
        className={className}
      />
    )
  }

  return (
    <section className={cn('space-y-4', className)}>
      <header className="reporting-shell-header no-print rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {eyebrow}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <BarChart3 size={18} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            {onRefresh ? (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </Button>
            ) : null}
            {actions}
          </div>
        </div>

        {summary ? <div className="mt-4">{summary}</div> : null}
        {comparison ? <div className="mt-4">{comparison}</div> : null}
      </header>

      {filters ? (
        <section className="reporting-shell-filters no-print rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          {filters}
        </section>
      ) : null}

      {error ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="min-w-0">{children}</div>
    </section>
  )
}
