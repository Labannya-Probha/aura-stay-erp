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
    <header className="mb-5 rounded-[22px] border border-slate-200/80 bg-white/80 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:px-5">
      {breadcrumb ? <div className="mb-3">{breadcrumb}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 text-slate-700 shadow-sm">
              <Icon size={19} aria-hidden="true" />
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
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
