import { supabase } from '../../../lib/supabase'
import { DASHBOARD_DEFAULT_DATA } from '../types/dashboard.types'

const RPC_TIMEOUT_MS = 6000
const missingRpcCache = new Set()
const dashboardRpcEnabled =
  !import.meta.env.DEV || import.meta.env.VITE_ENABLE_DASHBOARD_RPC === 'true'

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function safeObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
}

function isMissingRpcError(error) {
  const serialized = JSON.stringify(error || {})
  const message = String(error?.message || '')
  const details = String(error?.details || '')
  const hint = String(error?.hint || '')
  const status = String(error?.status || '')
  const code = String(error?.code || '')
  return (
    code === 'PGRST202' ||
    code === '404' ||
    /404/.test(status) ||
    /pgrst|404|not found/i.test(serialized) ||
    /does not exist|could not find.*function|schema cache|not found/i.test(
      `${message} ${details} ${hint}`,
    )
  )
}

async function rpcJson(name, fallback, tenantId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (missingRpcCache.has(name)) return fallback

  const withTimeout = (promise) =>
    Promise.race([
      promise,
      new Promise((resolve) => {
        window.setTimeout(
          () => resolve({ data: fallback, error: { message: `RPC timeout: ${name}` } }),
          RPC_TIMEOUT_MS,
        )
      }),
    ])

  const args = tenantId ? { p_tenant_id: tenantId } : undefined
  let result = await withTimeout(supabase.rpc(name, args))

  // Backward compatibility with existing RPCs that do not yet accept p_tenant_id.
  if (
    result.error &&
    tenantId &&
    /p_tenant_id|function .* does not exist/i.test(result.error.message || '')
  ) {
    result = await withTimeout(supabase.rpc(name))
  }

  if (result.error) {
    if (isMissingRpcError(result.error)) {
      missingRpcCache.add(name)
      console.info(`${name} is not available in this environment. Falling back to defaults.`)
      return fallback
    }
    console.warn(`${name} failed:`, result.error.message)
    return fallback
  }

  return result.data ?? fallback
}

async function rpcJsonWithMeta(name, fallback, tenantId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (missingRpcCache.has(name)) return { data: fallback, missingRpc: true }

  const withTimeout = (promise) =>
    Promise.race([
      promise,
      new Promise((resolve) => {
        window.setTimeout(
          () => resolve({ data: fallback, error: { message: `RPC timeout: ${name}` } }),
          RPC_TIMEOUT_MS,
        )
      }),
    ])

  const args = tenantId ? { p_tenant_id: tenantId } : undefined
  let result = await withTimeout(supabase.rpc(name, args))

  if (
    result.error &&
    tenantId &&
    /p_tenant_id|function .* does not exist/i.test(result.error.message || '')
  ) {
    result = await withTimeout(supabase.rpc(name))
  }

  if (result.error) {
    const missingRpc = isMissingRpcError(result.error)
    if (missingRpc) {
      missingRpcCache.add(name)
      console.info(`${name} is not available in this environment. Falling back to defaults.`)
    } else {
      console.warn(`${name} failed:`, result.error.message)
    }

    return { data: fallback, missingRpc }
  }

  return { data: result.data ?? fallback, missingRpc: false }
}

export async function getDashboardData({ tenantId } = {}) {
  if (!dashboardRpcEnabled) {
    return DASHBOARD_DEFAULT_DATA
  }

  const calls = [
    ['dashboard_summary', DASHBOARD_DEFAULT_DATA.summary],
    ['dashboard_revenue_trend', []],
    ['dashboard_occupancy_trend', []],
    ['dashboard_housekeeping_summary', DASHBOARD_DEFAULT_DATA.housekeeping],
    ['dashboard_restaurant_summary', DASHBOARD_DEFAULT_DATA.restaurant],
    ['dashboard_operational_tasks', []],
    ['dashboard_recent_activities', []],
  ]

  const [summaryName, summaryFallback] = calls[0]
  const summary = await rpcJsonWithMeta(summaryName, summaryFallback, tenantId)

  if (summary.missingRpc) {
    calls.forEach(([name]) => missingRpcCache.add(name))
    return DASHBOARD_DEFAULT_DATA
  }

  const results = await Promise.allSettled(
    calls.slice(1).map(([name, fallback]) => rpcJson(name, fallback, tenantId)),
  )

  const value = (index, fallback) => {
    if (index === 0) return summary.data
    const next = results[index - 1]
    return next?.status === 'fulfilled' ? next.value : fallback
  }

  return {
    summary: safeObject(value(0, DASHBOARD_DEFAULT_DATA.summary), DASHBOARD_DEFAULT_DATA.summary),
    revenueTrend: safeArray(value(1, [])),
    occupancyTrend: safeArray(value(2, [])),
    housekeeping: safeObject(
      value(3, DASHBOARD_DEFAULT_DATA.housekeeping),
      DASHBOARD_DEFAULT_DATA.housekeeping,
    ),
    restaurant: safeObject(
      value(4, DASHBOARD_DEFAULT_DATA.restaurant),
      DASHBOARD_DEFAULT_DATA.restaurant,
    ),
    tasks: safeArray(value(5, [])),
    activities: safeArray(value(6, [])),
  }
}
