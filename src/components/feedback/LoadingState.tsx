import { Loader2 } from 'lucide-react'
import { cn } from 'src/lib/utils'

type LoadingVariant = 'fullscreen' | 'container' | 'table'

type LoadingStateProps = {
  variant?: LoadingVariant
  label?: string
  description?: string
  rows?: number
  className?: string
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite" aria-label="Loading table data">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`loading-row-${index}`}
          className="h-9 w-full animate-pulse rounded-md border border-border/60 bg-muted/60"
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading rows</span>
    </div>
  )
}

export function LoadingState({
  variant = 'container',
  label = 'Loading',
  description,
  rows = 5,
  className,
}: LoadingStateProps) {
  if (variant === 'table') {
    return <TableSkeleton rows={Math.max(1, rows)} />
  }

  const isFullscreen = variant === 'fullscreen'

  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-xl border border-border/70 bg-card text-card-foreground',
        isFullscreen
          ? 'fixed inset-0 z-50 flex min-h-screen items-center justify-center rounded-none border-0 bg-background/95 p-6'
          : 'flex min-h-[180px] items-center justify-center p-8',
        className,
      )}
    >
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <Loader2 className="size-7 animate-spin text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </section>
  )
}

export default LoadingState
