export default function AedsPage({ title, subtitle, actions, tabs, children }) {
  return (
    <section className="space-y-6">
      <div className="aeds-card p-6">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--tenant-text)" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--tenant-text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
        </div>

        {tabs && <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--tenant-border)" }}>{tabs}</div>}
      </div>

      {children}
    </section>
  )
}
