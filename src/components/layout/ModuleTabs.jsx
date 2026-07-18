import { cn } from 'src/lib/utils'

/**
 * @typedef {Object} ModuleTab
 * @property {string} id
 * @property {string} label
 * @property {boolean} [hidden]
 * @property {boolean} [disabled]
 * @property {string|number} [badge]
 */

/**
 * @param {{
 *   tabs: ModuleTab[]
 *   activeTab?: string
 *   onChange?: (tabId: string) => void
 *   className?: string
 * }} props
 */
export default function ModuleTabs({ tabs = [], activeTab, onChange, className }) {
  const visibleTabs = tabs.filter((tab) => !tab.hidden)
  if (!visibleTabs.length) return null

  return (
    <div role="tablist" aria-label="Module tabs" className={cn('tab-strip-responsive w-full items-stretch justify-start gap-2', className)}>
      {visibleTabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`module-tab-panel-${tab.id}`}
            id={`module-tab-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => onChange?.(tab.id)}
            className={cn(
              'tab-button-responsive inline-flex min-w-[120px] items-center justify-start gap-2 rounded-2xl border px-4 py-2.5 text-left text-sm font-semibold transition-all',
              isActive
                ? 'border-[rgb(var(--tenant-primary-rgb)_/_0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,244,241,0.96))] text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--tenant-primary-rgb)_/_0.14)]'
                : 'border-border bg-background/90 text-muted-foreground hover:border-[rgb(var(--tenant-primary-rgb)_/_0.18)] hover:text-foreground hover:shadow-[0_8px_18px_rgba(15,23,42,0.05)]',
              tab.disabled && 'cursor-not-allowed opacity-60 shadow-none'
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left leading-none">{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null ? (
              <span className="rounded-full border border-border bg-white/90 px-2 py-0.5 text-[10px] font-bold leading-none text-muted-foreground shadow-sm">
                {tab.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
