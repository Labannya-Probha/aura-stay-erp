import Dashboard from "./Dashboard"
import { useDashboard } from "./hooks/useDashboard"
import { useNotificationCenter } from "../notifications/useNotificationCenter"
import { getTenantId } from "../../lib/tenant"

export default function DashboardPage({ company, userName }) {
  const tenantId = getTenantId()
  const dashboard = useDashboard({ realtime: true, tenantId })
  const notifications = useNotificationCenter({ tenantId, limit: 8 })

  return (
    <Dashboard
      company={company}
      userName={userName}
      notifications={notifications.rows}
      notificationsLoading={notifications.loading}
      notificationsError={notifications.error}
      {...dashboard}
    />
  )
}
