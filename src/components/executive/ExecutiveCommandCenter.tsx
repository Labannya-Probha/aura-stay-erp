import { RefreshCw, TrendingDown, TrendingUp, ShieldCheck } from 'lucide-react'

import { Button } from 'src/components/ui/button'
import { EmptyState } from 'src/components/feedback/EmptyState'
import { cn } from 'src/lib/utils'
import { useComparativeSeries } from 'src/hooks/useComparativeSeries'

import RoomStatusGrid from './RoomStatusGrid'

type ExecutiveCommandCenterProps = {
  title?: string
  subtitle?: string
  eyebrow?: string
  companyName?: string
  loading?: boolean
  error?: string | null
  isLive?: boolean
  lastUpdated?: Date | string | null
  refreshing?: boolean
  summary?: Record<string, any>
  revenueTrend?: any[]
  occupancyTrend?: any[]
  rooms?: any[]
  roomsLoading?: boolean
  onRefresh?: () => void
  children?: React.ReactNode
  className?: string
}

function statusTone(tone: string) {
  switch (tone) {
    case 'emerald':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'blue':
      return 'border-blue-200 bg-blue-50 text-blue-800'
    case 'amber':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'rose':
      return 'border-rose-200 bg-rose-50 text-rose-800'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-800'
  }
}

function TrendCard({ metric }: { metric: ReturnType<typeof useComparativeSeries>[number] }) {
  const path =
    metric.sparkline.length > 1
      ? metric.sparkline
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${(index / Math.max(metric.sparkline.length - 1, 1)) * 100}, ${100 - point}`,
          )
          .join(' ')
      : ''
  const DeltaIcon = metric.trend === 'down' ? TrendingDown : TrendingUp

  return (
    <article className={cn('rounded-[24px] border p-4 shadow-sm', statusTone(metric.tone))}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-75">
            {metric.label}
          </p>
          <div className="mt-2 text-2xl font-black tracking-tight">{metric.valueLabel}</div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide">
            <DeltaIcon size={12} aria-hidden="true" />
            {metric.deltaLabel}
          </div>
        </div>

        <div className="h-12 w-20 rounded-2xl bg-white/70 p-2 shadow-inner">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {path ? (
              <path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ) : null}
          </svg>
        </div>
      </div>
    </article>
  )
}

export default function ExecutiveCommandCenter({
  title = 'Executive Command Center',
  subtitle = 'Live hotel operations, revenue pulse, and floor control in one command surface.',
  eyebrow = 'Executive Operations',
  companyName,
  loading = false,
  error,
  isLive = false,
  lastUpdated,
  refreshing = false,
  summary = {},
  revenueTrend = [],
  occupancyTrend = [],
  rooms = [],
  roomsLoading = false,
  onRefresh,
  children,
  className,
}: ExecutiveCommandCenterProps) {
  const metrics = useComparativeSeries([
    {
      label: 'ADR',
      current: summary.adr,
      series: revenueTrend,
      seriesKeys: ['room', 'total', 'value', 'amount'],
      format: 'currency',
      tone: 'emerald',
    },
    {
      label: 'RevPAR',
      current: summary.revpar,
      series: revenueTrend,
      seriesKeys: ['room', 'pos', 'other', 'total', 'value'],
      format: 'currency',
      tone: 'blue',
    },
    {
      label: 'Occupancy %',
      current: summary.occupancy,
      series: occupancyTrend,
      seriesKeys: ['occupancy', 'value', 'percent'],
      format: 'percent',
      precision: 1,
      tone: 'amber',
    },
    {
      label: 'GOP',
      current: summary.gop ?? summary.netProfit ?? summary.roomRevenue ?? 0,
      series: revenueTrend,
      seriesKeys: ['room', 'pos', 'other', 'total', 'value'],
      format: 'currency',
      tone: 'rose',
    },
  ])

  if (loading && !metrics.some((item) => item.current)) {
    return (
      <section className={cn('w-full space-y-4', className)}>
        <div className="w-full overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,245,238,0.94))] p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-3 h-8 w-56 animate-pulse rounded-2xl bg-slate-200" />
              <div className="mt-2 h-3 w-72 animate-pulse rounded-full bg-slate-200/80" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[24px] border border-slate-200/70 bg-white/70 p-4"
              >
                <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-7 w-24 animate-pulse rounded-xl bg-slate-200" />
                <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-slate-200/80" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid w-full gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <div className="h-72 w-full animate-pulse rounded-[24px] border border-slate-200/70 bg-white/70" />
          </div>
          <div className="xl:col-span-5">
            <div className="h-72 w-full animate-pulse rounded-[24px] border border-slate-200/70 bg-white/70" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('space-y-4', className)}>
      <header className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,244,236,0.96))] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              {subtitle}
            </p>
            {companyName ? (
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {companyName}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide',
                isLive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800',
              )}
            >
              <ShieldCheck size={13} aria-hidden="true" />
              {isLive ? 'Live Feed' : 'Snapshot'}
            </span>
            {lastUpdated ? (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                Updated{' '}
                {new Date(lastUpdated).toLocaleTimeString('en-BD', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : null}
            {onRefresh ? (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <TrendCard key={metric.label} metric={metric} />
          ))}
        </div>
      </header>

      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <RoomStatusGrid rooms={rooms} loading={roomsLoading} />

      {children}

      {!children && !rooms?.length ? (
        <EmptyState
          variant="container"
          title="Command center content not configured"
          description="Pass dashboard widgets as children to complete the executive workspace layout."
        />
      ) : null}
    </section>
  )
}
