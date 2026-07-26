import Breadcrumbs from "./Breadcrumbs"
import GlobalSearch from "./GlobalSearch"
import UniversalActionBar from "./UniversalActionBar"
import CommandPalette from "./CommandPalette"
import { useCommandPalette } from "./hooks/useCommandPalette"

export default function AppTopBar({ company, role }) {
  const commandPalette = useCommandPalette()

  return (
    <>
      <header className="aeds-topbar sticky top-0 z-40 hidden h-[var(--aeds-topbar-height)] w-full items-center px-5 shadow-sm lg:flex">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <Breadcrumbs company={company} />

          <div
            className="hidden h-6 w-px xl:block"
            style={{ background: "var(--tenant-border)" }}
          />

          <div className="hidden min-w-0 flex-1 lg:block">
            <GlobalSearch onOpenCommand={commandPalette.open} />
          </div>
        </div>

        <UniversalActionBar
          role={role}
          tenantId={company?.tenant_id || company?.id}
          onOpenCommand={commandPalette.open}
        />
      </header>

      <CommandPalette
        open={commandPalette.isOpen}
        onClose={commandPalette.close}
      />
    </>
  )
}