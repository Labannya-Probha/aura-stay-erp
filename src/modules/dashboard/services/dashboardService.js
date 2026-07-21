import { supabase } from "../../../lib/supabase"
import { DASHBOARD_DEFAULT_DATA } from "../types/dashboard.types"

const RPC_TIMEOUT_MS = 6000

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function safeObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback
}

async function rpcJson(name, fallback, tenantId) {
  if (!supabase) throw new Error("Supabase is not configured.")

  const withTimeout = (promise) =>
    Promise.race([
      promise,
      new Promise((resolve) => {
        window.setTimeout(() => resolve({ data: fallback, error: { message: `RPC timeout: ${name}` } }), RPC_TIMEOUT_MS)
      }),
    ])

  const args = tenantId ? { p_tenant_id: tenantId } : undefined
  let result = await withTimeout(supabase.rpc(name, args))

  // Backward compatibility with existing RPCs that do not yet accept p_tenant_id.
  if (result.error && tenantId && /p_tenant_id|function .* does not exist/i.test(result.error.message || "")) {
    result = await withTimeout(supabase.rpc(name))
  }

  if (result.error) {
    console.warn(`${name} failed:`, result.error.message)
    return fallback
  }

  return result.data ?? fallback
}

export async function getDashboardData({ tenantId } = {}) {
  const calls = [
    ["dashboard_summary", DASHBOARD_DEFAULT_DATA.summary],
    ["dashboard_revenue_trend", []],
    ["dashboard_occupancy_trend", []],
    ["dashboard_housekeeping_summary", DASHBOARD_DEFAULT_DATA.housekeeping],
    ["dashboard_restaurant_summary", DASHBOARD_DEFAULT_DATA.restaurant],
    ["dashboard_operational_tasks", []],
    ["dashboard_recent_activities", []],
  ]

  const results = await Promise.allSettled(
    calls.map(([name, fallback]) => rpcJson(name, fallback, tenantId))
  )

  const value = (index, fallback) =>
    results[index].status === "fulfilled" ? results[index].value : fallback

  return {
    summary: safeObject(value(0, DASHBOARD_DEFAULT_DATA.summary), DASHBOARD_DEFAULT_DATA.summary),
    revenueTrend: safeArray(value(1, [])),
    occupancyTrend: safeArray(value(2, [])),
    housekeeping: safeObject(value(3, DASHBOARD_DEFAULT_DATA.housekeeping), DASHBOARD_DEFAULT_DATA.housekeeping),
    restaurant: safeObject(value(4, DASHBOARD_DEFAULT_DATA.restaurant), DASHBOARD_DEFAULT_DATA.restaurant),
    tasks: safeArray(value(5, [])),
    activities: safeArray(value(6, [])),
  }
}
