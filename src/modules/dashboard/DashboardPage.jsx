import Dashboard from './Dashboard'
import { useDashboard } from './hooks/useDashboard'
import { useNotificationCenter } from '../notifications/useNotificationCenter'
import { getTenantId } from '../../lib/tenant'
import { useRoomSnapshot } from '../../hooks/useRoomSnapshot'

export default function DashboardPage({ company, userName }) {
  const tenantId = getTenantId()
  // Without tenant context, global realtime subscriptions can flood refresh events.
  const dashboard = useDashboard({ realtime: Boolean(tenantId), tenantId })
  const notifications = useNotificationCenter({ tenantId, limit: 8 })
  const rooms = useRoomSnapshot({ tenantId, limit: 300 })

  return (
    <Dashboard
      company={company}
      userName={userName}
      notifications={notifications.rows}
      notificationsLoading={notifications.loading}
      notificationsError={notifications.error}
      rooms={rooms.rooms}
      roomsLoading={rooms.loading}
      roomsError={rooms.error}
      roomsRefreshing={rooms.refreshing}
      onRoomsRefresh={rooms.refresh}
      {...dashboard}
    />
  )
}
