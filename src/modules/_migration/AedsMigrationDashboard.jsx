import { AEDS_V3_SPRINTS } from "./sprints"
import { AedsPage } from "../../design-system/page"

export default function AedsMigrationDashboard() {
  return (
    <AedsPage
      title="AEDS v3 Migration"
      subtitle="Sprint-based stabilization dashboard for Aura Stay ERP."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        {AEDS_V3_SPRINTS.map((sprint) => (
          <div key={sprint.id} className="aeds-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black" style={{ color: "var(--tenant-text)" }}>{sprint.title}</h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--tenant-primary)" }}>
                  {sprint.status}
                </p>
              </div>
              <span className="aeds-pill-primary rounded-full px-3 py-1 text-xs font-black">
                {sprint.id}
              </span>
            </div>

            <ul className="mt-4 space-y-2">
              {sprint.scope.map((item) => (
                <li key={item} className="text-sm font-semibold" style={{ color: "var(--tenant-text-muted)" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AedsPage>
  )
}
