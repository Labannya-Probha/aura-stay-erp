import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "Booking Calendar",
    "description": "Room timeline and availability board."
  },
  {
    "title": "Availability Engine",
    "description": "Room inventory, date range and room type control."
  },
  {
    "title": "Rate Plan Engine",
    "description": "Tariff, discount and package rules."
  },
  {
    "title": "Guest CRM",
    "description": "Guest profile, preferences and stay history."
  },
  {
    "title": "Quotation Engine",
    "description": "Corporate and group quotation workflow."
  },
  {
    "title": "Cancellation / No-show",
    "description": "Penalty, release inventory and audit control."
  }
]

export default function ReservationEngineDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 14"
      title="Reservation & Booking Engine"
      subtitle="Booking calendar, availability, rate plan, guest CRM, quotation and reservation workflow."
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
