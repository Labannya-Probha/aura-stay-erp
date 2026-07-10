import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "Touch POS",
    "description": "Table, item, quantity and modifier based ordering."
  },
  {
    "title": "KOT Engine",
    "description": "Kitchen order tickets and preparation status."
  },
  {
    "title": "Billing & Settlement",
    "description": "Split bill, discount, void and settlement control."
  },
  {
    "title": "Menu Engineering",
    "description": "Menu items, recipes, cost and margin."
  },
  {
    "title": "Kitchen Display",
    "description": "Preparation queue and service timing."
  },
  {
    "title": "Thermal Print",
    "description": "80mm receipt, KOT and cashier copy."
  }
]

export default function RestaurantPosEngineDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 15"
      title="Restaurant POS Engine"
      subtitle="Touch POS, KOT, receipt, settlement, kitchen workflow and menu engineering."
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
