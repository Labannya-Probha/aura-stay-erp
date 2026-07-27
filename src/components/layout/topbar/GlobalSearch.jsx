import { Search } from 'lucide-react'

export default function GlobalSearch({ onOpenCommand }) {
  return (
    <button
      type="button"
      onClick={onOpenCommand}
      className="aeds-input flex h-10.5 w-full max-w-2xl items-center gap-3 px-4 text-left text-sm transition hover:bg-white"
      style={{ boxShadow: '0 10px 22px rgb(15 23 42 / 0.05)' }}
    >
      <Search size={16} style={{ color: 'var(--tenant-primary)' }} />
      <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--tenant-text-muted)' }}>
        Search guest, reservation, room, invoice, voucher...
      </span>
      <kbd
        className="hidden rounded-lg border bg-white px-2 py-1 text-[10px] font-extrabold xl:inline-flex"
        style={{
          color: 'var(--tenant-text-muted)',
          borderColor: 'var(--tenant-border)',
          boxShadow: '0 1px 0 rgb(255 255 255 / 0.8) inset',
        }}
      >
        Ctrl K
      </kbd>
    </button>
  )
}
