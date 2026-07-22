import type { ComponentType, ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { cn } from 'src/lib/utils'

type EmptyVariant = 'fullscreen' | 'container' | 'table'

type EmptyStateAction = {
  label: string
  onClick: () => void
  disabled?: boolean
}

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ComponentType<{ className?: string }> | null
  action?: EmptyStateAction
  variant?: EmptyVariant
  supplementary?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  variant = 'container',
  supplementary,
  className,
}: EmptyStateProps) {
  const isFullscreen = variant === 'fullscreen'

  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-xl border border-dashed border-border bg-muted/25 px-4 py-8 text-center',
        isFullscreen
          ? 'fixed inset-0 z-40 flex min-h-screen items-center justify-center rounded-none border-0 bg-background p-6'
          : variant === 'table'
            ? 'flex min-h-[180px] items-center justify-center border-0 bg-transparent py-10'
            : 'flex min-h-[200px] items-center justify-center',
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg flex-col items-center gap-2">
        {Icon ? <Icon className="size-7 text-muted-foreground" aria-hidden="true" /> : null}
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
        {supplementary ? (
          <div className="mt-1 text-sm text-muted-foreground">{supplementary}</div>
        ) : null}
        {action ? (
          <Button
            className="mt-3"
            variant="outline"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

export default EmptyState
