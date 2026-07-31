import Breadcrumbs from './Breadcrumbs'
import GlobalSearch from './GlobalSearch'
import UniversalActionBar from './UniversalActionBar'
import CommandPalette from './CommandPalette'
import { useCommandPalette } from './hooks/useCommandPalette'
import { useTheme } from '../../../theme'

export default function AppTopBar({ company, role }) {
  const commandPalette = useCommandPalette()
  const { effectiveMode, setThemeMode } = useTheme()

  return (
    <>
      <header className="aeds-topbar sticky top-0 z-40 hidden h-[var(--aeds-topbar-height)] w-full items-center border-b border-[color-mix(in_srgb,var(--tenant-border)_80%,transparent)] px-4 lg:flex">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Breadcrumbs company={company} />

          <div
            className="hidden h-7 w-px xl:block"
            style={{ background: 'var(--tenant-border)' }}
          />

          <div className="hidden min-w-0 flex-1 lg:block">
            <GlobalSearch onOpenCommand={commandPalette.open} />
          </div>
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-2">
          <label className="hidden items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--tenant-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--tenant-surface)_90%,white)] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--tenant-text-muted)] xl:flex">
            <span className="text-[10px]">Theme</span>
            <select
              value={effectiveMode}
              onChange={(event) => setThemeMode(event.target.value)}
              className="bg-transparent pr-1 text-[11px] font-semibold outline-none"
              aria-label="Select display theme"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <UniversalActionBar role={role} onOpenCommand={commandPalette.open} />
        </div>
      </header>

      <CommandPalette open={commandPalette.isOpen} onClose={commandPalette.close} />
    </>
  )
}
