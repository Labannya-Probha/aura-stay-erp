import { Command } from 'lucide-react'
import QuickCreate from './QuickCreate'
import NotificationCenter from './NotificationCenter'
import OnlineStatusBadge from './OnlineStatusBadge'

export default function UniversalActionBar({ role, onOpenCommand }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <QuickCreate role={role} />
      <NotificationCenter />
      <OnlineStatusBadge />
      <button
        type="button"
        onClick={onOpenCommand}
        className="hidden h-9 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--tenant-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--tenant-surface)_93%,white)] px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--tenant-text-muted)] transition hover:border-[color-mix(in_srgb,var(--tenant-primary)_28%,var(--tenant-border))] hover:text-[color:var(--tenant-text)] xl:flex"
      >
        <Command size={14} />
        Ctrl K
      </button>
    </div>
  )
}
