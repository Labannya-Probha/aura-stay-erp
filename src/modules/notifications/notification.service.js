import { supabase } from '../../lib/supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

async function hasSession() {
  const { data } = await supabase.auth.getSession()
  return Boolean(data?.session)
}

export async function getUnreadNotifications({ limit = 50 } = {}) {
  requireSupabase()
  if (!(await hasSession())) return []

  // DB function reads tenant from JWT app_metadata/current_tenant_id(); no tenant arg required.
  const result = await supabase.rpc('notification_center_feed', { p_limit: limit })
  if (result.error) throw result.error
  return Array.isArray(result.data) ? result.data : []
}

export async function markNotificationRead(id) {
  requireSupabase()
  if (!(await hasSession())) return false
  const { error } = await supabase.rpc('mark_notification_read', { p_notification_id: id })
  if (error) throw error
  return true
}

export async function markAllNotificationsRead() {
  requireSupabase()
  if (!(await hasSession())) return 0
  const { error } = await supabase.rpc('mark_all_notifications_read')
  if (error) throw error
  return 1
}

export function subscribeToNotifications({ tenantId, onInsert, onChange }) {
  if (!tenantId || !supabase) return () => {}

  const channel = supabase
    .channel(`notification-center-${tenantId}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => onInsert?.(payload.new),
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `tenant_id=eq.${tenantId}`,
      },
      () => onChange?.(),
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `tenant_id=eq.${tenantId}`,
      },
      () => onChange?.(),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
