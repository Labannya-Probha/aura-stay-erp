export default function AedsPage({ title, subtitle, actions, tabs, children }) {
  return (
    <section className="space-y-6">
      <div className="aeds-card p-4 sm:p-4">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1
              className="aeds-page-title text-[30px] font-semibold tracking-tight"
              style={{ color: 'var(--tenant-text)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-2 max-w-3xl text-sm font-medium leading-6"
                style={{ color: 'var(--tenant-text-muted)' }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
        </div>

        {tabs && (
          <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--tenant-border)' }}>
            {tabs}
          </div>
        )}
      </div>

      {children}
    </section>
  )
}
