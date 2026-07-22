import { cn } from 'src/lib/utils'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

type ModuleStatusPillProps = {
  status?: string | null
  toneMap?: Record<string, Tone>
}

const TONE_CLASS_MAP: Record<Tone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
}

const DEFAULT_TONE_MAP: Record<string, Tone> = {
  ARRIVAL: 'info',
  DEPARTURE: 'warning',
  IN_HOUSE: 'success',
  CLEAN: 'success',
  INSPECTED: 'info',
  DIRTY: 'danger',
  DUE: 'danger',
  OPEN: 'warning',
  CLOSED: 'neutral',
  PAID: 'success',
  PENDING: 'warning',
}

export default function ModuleStatusPill({ status, toneMap }: ModuleStatusPillProps) {
  const normalized = String(status || 'UNKNOWN')
    .trim()
    .toUpperCase()
  const tone = (toneMap?.[normalized] || DEFAULT_TONE_MAP[normalized] || 'neutral') as Tone

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide',
        TONE_CLASS_MAP[tone],
      )}
    >
      {normalized.replaceAll('_', ' ')}
    </span>
  )
}
