import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, SlidersHorizontal } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { cn } from '../../../lib/utils'

type ReportingStudioShellProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
  summary?: ReactNode
  comparison?: ReactNode
  filters?: ReactNode
  filterCount?: number
  filtersInitiallyOpen?: boolean
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
  eyebrow = 'Reports',
  breadcrumbs,
  actions,
  summary,
  comparison,
  filters,
  filterCount = 0,
  filtersInitiallyOpen = true,
  loading = false,
  empty = false,
  error,
  onRefresh,
  refreshing = false,
  children,
  className,
}: ReportingStudioShellProps) {
  const [filtersOpen, setFiltersOpen] = useState(filtersInitiallyOpen)

  if (loading) {
    return (
      <LoadingState
        variant="container"
        label={`Loading ${title}`}
        description="Preparing the report workspace."
        className={className}
      />
    )
  }

  if (empty) {
    return (
      <EmptyState
        variant="container"
        title={`No data for ${title}`}
        description={subtitle || 'Change the criteria and run the report again.'}
        className={className}
      />
    )
  }

  return (
    <section className={cn('min-w-0 space-y-3', className)}>
      <header className="no-print overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            {breadcrumbs ? (
              <div className="mb-1 text-xs font-medium text-slate-500">{breadcrumbs}</div>
            ) : (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                {eyebrow}
              </p>
            )}

            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="min-w-0 truncate text-sm font-normal text-slate-500 lg:max-w-2xl">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {onRefresh ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Refresh report data"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </Button>
            ) : null}
            {actions}
          </div>
        </div>

        {(summary || comparison) && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              {summary ? <div className="min-w-0">{summary}</div> : <span />}
              {comparison ? <div className="min-w-0">{comparison}</div> : null}
            </div>
          </div>
        )}
      </header>

      {filters ? (
        <section className="no-print overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
            aria-expanded={filtersOpen}
            aria-controls="report-criteria-panel"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <SlidersHorizontal size={16} aria-hidden="true" />
              Report criteria
              {filterCount > 0 ? (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {filterCount}
                </span>
              ) : null}
            </span>
            {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {filtersOpen ? (
            <div id="report-criteria-panel" className="border-t border-slate-100 px-4 py-3">
              {filters}
            </div>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
        >
          {error}
        </div>
      ) : null}

      <div className="min-w-0">{children}</div>
    </section>
  )
}
