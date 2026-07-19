import { RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/button'

export default function FrontOfficePageHeader({ page, onRefresh, refreshing = false, actions }) {
  const Icon = page?.icon

  return (
    <header className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <Icon size={19} aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">{page?.title}</h1>
          {page?.description ? (
            <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">{page.description}</p>
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
    </header>
  )
}
