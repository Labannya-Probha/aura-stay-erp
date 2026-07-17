import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "Purchase Order",
    "description": "PO creation, approval and vendor selection."
  },
  {
    "title": "Goods Receipt",
    "description": "GRN and inventory increase workflow."
  },
  {
    "title": "Stock Issue",
    "description": "Department issue and consumption posting."
  },
  {
    "title": "Reorder Control",
    "description": "Minimum stock, reorder alert and suggested PO."
  },
  {
    "title": "Supplier Management",
    "description": "Vendor profile, price and payment terms."
  },
  {
    "title": "Stock Valuation",
    "description": "FIFO/weighted average valuation foundation."
  }
]

export default function InventoryEngineDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 16"
      title="Inventory & Procurement Engine"
      subtitle="Purchase, GRN, stock issue, consumption, reorder and supplier management."
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
