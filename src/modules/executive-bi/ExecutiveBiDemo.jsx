import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "Executive Dashboard",
    "description": "Revenue, profit, occupancy and cash overview."
  },
  {
    "title": "Forecast Engine",
    "description": "Rooms on book and revenue projection."
  },
  {
    "title": "Profitability",
    "description": "Department and product profitability analysis."
  },
  {
    "title": "Cash Flow BI",
    "description": "Collection, payment and fund position."
  },
  {
    "title": "Owner Dashboard",
    "description": "Owner/shareholder performance view."
  },
  {
    "title": "Anomaly Detection",
    "description": "Variance, exception and risk alerts foundation."
  }
]

export default function ExecutiveBiDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 18"
      title="Executive BI & Analytics"
      subtitle="Management BI, KPI, forecast, profitability, cash flow and tenant-level dashboards."
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
