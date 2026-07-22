import type { ComponentType, ReactNode } from 'react'
import { Card, CardContent } from 'src/components/ui/card'
import LoadingState from 'src/components/feedback/LoadingState'
import EmptyState from 'src/components/feedback/EmptyState'
import ModuleRouteBoundary from 'src/components/shared/ModuleRouteBoundary'
import ModulePageHeader from 'src/components/shared/ModulePageHeader'

type ModuleContainerProps = {
  moduleName: string
  routeKey?: string
  title: string
  description?: string
  eyebrow?: string
  breadcrumb?: ReactNode
  icon?: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }> | null
  actions?: ReactNode
  kpis?: ReactNode
  filterBar?: ReactNode
  tabs?: ReactNode
  loading?: boolean
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  error?: string | null
  onRefresh?: () => void
  refreshing?: boolean
  children: ReactNode
}

export default function ModuleContainer({
  moduleName,
  routeKey,
  title,
  description,
  eyebrow,
  breadcrumb,
  icon,
  actions,
  kpis,
  filterBar,
  tabs,
  loading = false,
  empty = false,
  emptyTitle = 'No data found',
  emptyDescription = 'Try changing filters or creating a new record.',
  error,
  onRefresh,
  refreshing = false,
  children,
}: ModuleContainerProps) {
  const content = loading ? (
    <LoadingState variant="container" label={`Loading ${moduleName}`} />
  ) : empty ? (
    <EmptyState variant="container" title={emptyTitle} description={emptyDescription} />
  ) : (
    children
  )

  return (
    <section className="space-y-4">
      <Card className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <ModulePageHeader
            title={title}
            description={description}
            eyebrow={eyebrow}
            breadcrumb={breadcrumb}
            icon={icon}
            actions={actions}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />

          {kpis ? <div>{kpis}</div> : null}
          {filterBar ? <div>{filterBar}</div> : null}
          {tabs ? <div>{tabs}</div> : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <ModuleRouteBoundary moduleName={moduleName} routeKey={routeKey}>
            {content}
          </ModuleRouteBoundary>
        </CardContent>
      </Card>
    </section>
  )
}
