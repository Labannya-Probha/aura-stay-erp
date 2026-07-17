import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from 'src/components/ui/card'
import { cn } from 'src/lib/utils'

/**
 * @typedef {Object} KpiItem
 * @property {string} label
 * @property {string|number} value
 * @property {'up'|'down'|'neutral'|string|number} [trend]
 * @property {import('react').ComponentType<{className?: string}>} [icon]
 * @property {boolean} [loading]
 */

/**
 * @param {{
 *   items: KpiItem[]
 *   loading?: boolean
 *   className?: string
 * }} props
 */
export default function KpiStrip({ items = [], loading = false, className }) {
  const uniqueItems = Array.from(
    new Map(items.filter(Boolean).map((item) => [item.id || item.label, item])).values()
  )

  if (!uniqueItems.length) return null

  const desktopColumnsClass = uniqueItems.length >= 4
    ? 'lg:grid-cols-4'
    : uniqueItems.length === 3
      ? 'lg:grid-cols-3'
      : uniqueItems.length === 2
        ? 'lg:grid-cols-2'
        : 'lg:grid-cols-1'

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', desktopColumnsClass, className)}>
      {uniqueItems.map((item) => {
        const Icon = item.icon
        const isLoading = loading || item.loading
        const trendText = item.trend === undefined || item.trend === null ? null : String(item.trend)
        const trendLower = trendText?.toLowerCase() || ''
        const TrendIcon = trendLower === 'up' ? TrendingUp : trendLower === 'down' ? TrendingDown : null

        return (
          <Card key={item.id || item.label} size="sm">
            <CardContent className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground" aria-busy={isLoading}>
                  {isLoading ? '—' : item.value}
                </p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                {TrendIcon ? <TrendIcon className="size-4" aria-hidden="true" /> : null}
                {trendText ? (
                  <span className={cn('text-xs', trendLower === 'down' ? 'text-destructive' : trendLower === 'up' ? 'text-emerald-700' : '')}>
                    {trendText}
                  </span>
                ) : null}
                {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
