import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "Room Board",
    "description": "Live room status, occupancy and assignment board."
  },
  {
    "title": "Check-in Flow",
    "description": "Guest identity, payment, room assignment and registration card."
  },
  {
    "title": "Check-out Flow",
    "description": "Folio settlement, due validation and invoice issue."
  },
  {
    "title": "Guest Folio",
    "description": "Room, service, tax, payment and adjustment posting."
  },
  {
    "title": "Room Move / Upgrade",
    "description": "Room transfer, rate change and audit trail."
  },
  {
    "title": "Service Posting",
    "description": "Laundry, minibar, restaurant and other service posting."
  }
]

export default function FrontOfficeEngineDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 13"
      title="Front Office Engine"
      subtitle="Oracle OPERA style front office foundation for check-in, check-out, folio, room move and guest services."
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
