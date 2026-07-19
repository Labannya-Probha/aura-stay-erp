import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "CI Quality Gate",
    "description": "Lint, build and test pipeline foundation."
  },
  {
    "title": "Health Check",
    "description": "Frontend, API and Supabase diagnostic checks."
  },
  {
    "title": "Backup Plan",
    "description": "Database backup and restore strategy docs."
  },
  {
    "title": "Environment Manager",
    "description": "Development, staging and production env guide."
  },
  {
    "title": "Release Checklist",
    "description": "Deployment readiness and rollback checklist."
  },
  {
    "title": "Monitoring Hooks",
    "description": "Error, performance and audit logging structure."
  }
]

export default function ProductionToolkitDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 20"
      title="Production Deployment Toolkit"
      subtitle="CI/CD, quality gates, health check, backup, monitoring and deployment safety framework."
    >
      <div className="aeds-core-grid">
        {cards.map((card) => (
          <AedsEngineCard key={card.title} title={card.title} description={card.description}>
            <div className="aeds-core-list">
              <div className="aeds-core-list-item">
                <span>Status</span>
                <strong>Foundation Ready</strong>
              </div>
              <div className="aeds-core-list-item">
                <span>Architecture</span>
                <strong>Metadata-first</strong>
              </div>
              <div className="aeds-core-list-item">
                <span>Rating Target</span>
                <strong>10/10</strong>
              </div>
            </div>
          </AedsEngineCard>
        ))}
      </div>
    </AedsEnginePage>
  )
}
