import { supabase } from "../../../supabase"
import { DASHBOARD_DEFAULT_DATA } from "../types/dashboard.types"

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function safeObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : fallback
}

async function rpcJson(name, fallback) {
  const { data, error } = await supabase.rpc(name)

  if (error) {
    console.warn(`${name} failed:`, error.message)
    return fallback
  }

  return data ?? fallback
}

export async function getDashboardSummary() {
  const data = await rpcJson("dashboard_summary", DASHBOARD_DEFAULT_DATA.summary)
  return safeObject(data, DASHBOARD_DEFAULT_DATA.summary)
}

export async function getRevenueTrend() {
  const data = await rpcJson("dashboard_revenue_trend", [])
  return safeArray(data)
}

export async function getOccupancyTrend() {
  const data = await rpcJson("dashboard_occupancy_trend", [])
  return safeArray(data)
}

export async function getHousekeepingSummary() {
  const data = await rpcJson("dashboard_housekeeping_summary", DASHBOARD_DEFAULT_DATA.housekeeping)
  return safeObject(data, DASHBOARD_DEFAULT_DATA.housekeeping)
}

export async function getRestaurantSummary() {
  const data = await rpcJson("dashboard_restaurant_summary", DASHBOARD_DEFAULT_DATA.restaurant)
  return safeObject(data, DASHBOARD_DEFAULT_DATA.restaurant)
}

export async function getOperationalTasks() {
  const data = await rpcJson("dashboard_operational_tasks", [])
  return safeArray(data)
}

export async function getRecentActivities() {
  const data = await rpcJson("dashboard_recent_activities", [])
  return safeArray(data)
}

export async function getDashboardData() {
  const [
    summary,
    revenueTrend,
    occupancyTrend,
    housekeeping,
    restaurant,
    tasks,
    activities,
  ] = await Promise.all([
    getDashboardSummary(),
    getRevenueTrend(),
    getOccupancyTrend(),
    getHousekeepingSummary(),
    getRestaurantSummary(),
    getOperationalTasks(),
    getRecentActivities(),
  ])

  return {
    summary,
    revenueTrend,
    occupancyTrend,
    housekeeping,
    restaurant,
    tasks,
    activities,
  }
}
