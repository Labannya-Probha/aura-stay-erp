import { supabase } from "../../../lib/supabase"
import { getTenantId } from "../../../lib/tenant"

const NO_TENANT = "00000000-0000-0000-0000-000000000000"

export function subscribeToReservationChanges({
  onChange,
  onStatus,
  tenantId = getTenantId(),
} = {}) {
  if (!supabase) {
    onStatus?.("unavailable")
    return () => {}
  }

  const scopedTenantId = tenantId || NO_TENANT
  const channel = supabase
    .channel(`reservations:${scopedTenantId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservations",
        filter: `tenant_id=eq.${scopedTenantId}`,
      },
      (payload) => onChange?.(payload)
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservation_rooms",
        filter: `tenant_id=eq.${scopedTenantId}`,
      },
      (payload) => onChange?.(payload)
    )
    .subscribe((status) => onStatus?.(String(status || "").toLowerCase()))

  return () => {
    supabase.removeChannel(channel)
  }
}
