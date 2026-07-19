import { AedsDashboardEngine } from "../../../components/dashboard-engine"
import { EXECUTIVE_DASHBOARD_WIDGETS } from "../../../components/dashboard-engine/dashboardWidgetRegistry"

export default function ExecutiveDashboardV5() {
  return (
    <AedsDashboardEngine
      title="Executive Dashboard"
      subtitle="Revenue, occupancy, operations and approval overview for management."
      widgets={EXECUTIVE_DASHBOARD_WIDGETS}
    />
  )
}
