import { supabase } from "../../lib/supabase"

export async function getUnreadNotifications({
  limit = 50,
} = {}) {
  const refreshResult = await supabase.rpc(
    "refresh_operational_notifications"
  )

  if (refreshResult.error) {
    console.warn(
      "Operational notification refresh failed:",
      refreshResult.error.message
    )
  }

  const { data, error } = await supabase.rpc(
    "notification_center_feed",
    {
      p_limit: limit,
    }
  )

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function markNotificationRead(id) {
  const { error } = await supabase.rpc(
    "mark_notification_read",
    {
      p_notification_id: id,
    }
  )

  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.rpc(
    "mark_all_notifications_read"
  )

  if (error) throw error
}

export function subscribeToNotifications({
  tenantId,
  onChange,
}) {
  if (!tenantId) {
    return () => {}
  }

  const channel = supabase
    .channel(`notification-center-${tenantId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `tenant_id=eq.${tenantId}`,
      },
      () => onChange?.()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
