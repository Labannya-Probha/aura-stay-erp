export const DASHBOARD_DEFAULT_SUMMARY = {
  occupancy: 0,
  adr: 0,
  revpar: 0,
  roomRevenue: 0,
  restaurantRevenue: 0,
  cashCollection: 0,
  arrivals: 0,
  departures: 0,
  inHouseGuests: 0,
  availableRooms: 0,
  dirtyRooms: 0,
  pendingTasks: 0,
}

export const DASHBOARD_DEFAULT_DATA = {
  summary: DASHBOARD_DEFAULT_SUMMARY,
  revenueTrend: [],
  occupancyTrend: [],
  housekeeping: {
    clean: 0,
    dirty: 0,
    inspection: 0,
    outOfOrder: 0,
  },
  restaurant: {
    sales: 0,
    orders: 0,
    openKot: 0,
    averageBill: 0,
    topItem: "-",
  },
  tasks: [],
  activities: [],
}
