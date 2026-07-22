import type { ComponentType, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from 'src/components/ui/button'

type ModulePageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  breadcrumb?: ReactNode
  icon?: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }> | null
  actions?: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
}

export default function ModulePageHeader({
  title,
  description,
  eyebrow,
  breadcrumb,
  icon: Icon,
  actions,
  onRefresh,
  refreshing = false,
}: ModulePageHeaderProps) {
  return (
    <header className="mb-5 border-b border-slate-200 pb-4">
      {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
              <Icon size={19} aria-hidden="true" />
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {onRefresh ? (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
