import { Command } from 'lucide-react'
import QuickCreate from './QuickCreate'
import NotificationCenter from './NotificationCenter'
import OnlineStatusBadge from './OnlineStatusBadge'

export default function UniversalActionBar({ role, onOpenCommand }) {
  return (
    <div className="ml-4 flex shrink-0 items-center gap-2">
      <QuickCreate role={role} />
      <NotificationCenter />
      <OnlineStatusBadge />
      <button
        type="button"
        onClick={onOpenCommand}
        className="hidden h-9 items-center gap-2 rounded-xl border px-3 text-xs font-extrabold transition xl:flex"
        style={{
          borderColor: 'color-mix(in srgb, var(--tenant-border) 88%, transparent)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--tenant-surface) 95%, white), var(--tenant-surface))',
          color: 'var(--tenant-text-muted)',
          boxShadow: '0 8px 18px rgb(15 23 42 / 0.06)',
        }}
      >
        <Command size={15} />
        Ctrl K
      </button>
    </div>
  )
}
