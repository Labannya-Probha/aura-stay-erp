import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "Manager App",
    "description": "Approval, KPI and notification view."
  },
  {
    "title": "Housekeeping App",
    "description": "Room status and task update."
  },
  {
    "title": "Guest App",
    "description": "Service request and QR menu foundation."
  },
  {
    "title": "Offline Mode",
    "description": "Local draft and sync-ready structure."
  },
  {
    "title": "Push Notifications",
    "description": "Mobile notification hooks."
  },
  {
    "title": "PWA Manifest",
    "description": "Installable mobile web app foundation."
  }
]

export default function MobileCompanionDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 19"
      title="Mobile Companion Platform"
      subtitle="Mobile-ready PWA foundation for managers, housekeeping, approvals and guest services."
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
