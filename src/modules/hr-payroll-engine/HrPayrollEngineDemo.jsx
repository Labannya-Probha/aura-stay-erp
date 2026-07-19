import AedsEnginePage from "../../core/AedsEnginePage.jsx"
import AedsEngineCard from "../../core/AedsEngineCard.jsx"
import "../../core/aeds-core.css"

const cards = [
  {
    "title": "Employee Master",
    "description": "Employee profile and employment record."
  },
  {
    "title": "Service Book",
    "description": "Bangladesh labour compliance service record."
  },
  {
    "title": "Attendance",
    "description": "Daily attendance and roster foundation."
  },
  {
    "title": "Leave Engine",
    "description": "Leave application, approval and balance."
  },
  {
    "title": "Payroll Engine",
    "description": "Salary, allowance, deduction and payslip."
  },
  {
    "title": "HR Compliance",
    "description": "DIFE, employee register and statutory forms."
  }
]

export default function HrPayrollEngineDemo() {
  return (
    <AedsEnginePage
      badge="AEDS v5 · Sprint 17"
      title="HR & Payroll Engine"
      subtitle="Employee, attendance, leave, payroll, service book and compliance foundation."
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
