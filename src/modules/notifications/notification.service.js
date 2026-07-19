import { supabase } from "../../lib/supabase"

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.")
}

export async function getUnreadNotifications({ limit = 50, tenantId } = {}) {
  requireSupabase()
  let refreshArgs = tenantId ? { p_tenant_id: tenantId } : undefined
  let refreshResult = await supabase.rpc("refresh_operational_notifications", refreshArgs)
  if (refreshResult.error && tenantId && /p_tenant_id|function .* does not exist/i.test(refreshResult.error.message || "")) {
    refreshResult = await supabase.rpc("refresh_operational_notifications")
  }
  if (refreshResult.error) {
    console.warn("Operational notification refresh failed:", refreshResult.error.message)
  }

  const args = { p_limit: limit }
  if (tenantId) args.p_tenant_id = tenantId

  let result = await supabase.rpc("notification_center_feed", args)
  if (result.error && tenantId && /p_tenant_id|function .* does not exist/i.test(result.error.message || "")) {
    result = await supabase.rpc("notification_center_feed", { p_limit: limit })
  }
  if (result.error) throw result.error
  return Array.isArray(result.data) ? result.data : []
}

export async function markNotificationRead(id) {
  requireSupabase()
  const { error } = await supabase.rpc("mark_notification_read", { p_notification_id: id })
  if (error) throw error
}

export async function markAllNotificationsRead() {
  requireSupabase()
  const { error } = await supabase.rpc("mark_all_notifications_read")
  if (error) throw error
}

export function subscribeToNotifications({ tenantId, onInsert, onChange }) {
  if (!tenantId || !supabase) return () => {}

  const channel = supabase
    .channel(`notification-center-${tenantId}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => onInsert?.(payload.new)
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `tenant_id=eq.${tenantId}`,
      },
      () => onChange?.()
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
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
