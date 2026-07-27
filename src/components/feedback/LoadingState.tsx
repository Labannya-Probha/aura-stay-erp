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
        'rounded-2xl border border-border/60 bg-card/80 text-card-foreground shadow-sm backdrop-blur',
        isFullscreen
          ? 'fixed inset-0 z-50 flex min-h-screen items-center justify-center rounded-none border-0 bg-background/85 p-6'
          : 'flex min-h-[160px] items-center justify-center p-6',
        className,
      )}
    >
      <div className="flex max-w-md flex-col items-center gap-2.5 text-center">
        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2">
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">{label}</p>
        </div>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </section>
  )
}

export default LoadingState
