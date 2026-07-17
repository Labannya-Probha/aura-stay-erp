import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "Voucher Engine",
    "description": "Journal voucher, approval, posting and reversal workflow."
  },
  {
    "title": "Chart of Accounts",
    "description": "IFRS-aware COA with control account mapping."
  },
  {
    "title": "Ledger & Trial Balance",
    "description": "Account movement, debit/credit validation and closing balances."
  },
  {
    "title": "Financial Statements",
    "description": "P&L, Balance Sheet, Cash Flow and notes foundation."
  },
  {
    "title": "Fixed Assets",
    "description": "Asset register, depreciation and disposal control."
  },
  {
    "title": "Bank Reconciliation",
    "description": "Bank statement import and reconciliation workflow."
  }
]

export default function AccountingEngineDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 12"
      title="Enterprise Accounting Engine"
      subtitle="IFRS-ready accounting, voucher, ledger, trial balance, financial statements, fixed assets and bank reconciliation."
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
