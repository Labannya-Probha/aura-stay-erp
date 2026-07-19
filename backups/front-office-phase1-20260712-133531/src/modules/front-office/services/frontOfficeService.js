import { supabase } from "../../../lib/supabase"

export async function getFrontOfficeSummary() {
  const { data, error } = await supabase.rpc("front_office_summary")
  if (error) {
    console.warn("front_office_summary failed:", error.message)
    return {
      arrivals: 0,
      departures: 0,
      inHouse: 0,
      availableRooms: 0,
      dirtyRooms: 0,
      dueBalance: 0,
    }
  }
  return data || {}
}

export async function getArrivalBoard(filters = {}) {
  const { data, error } = await supabase.rpc("front_office_arrivals", { p_filters: filters })
  if (error) {
    console.warn("front_office_arrivals failed:", error.message)
    return []
  }
  return Array.isArray(data) ? data : []
}

export async function getDepartureBoard(filters = {}) {
  const { data, error } = await supabase.rpc("front_office_departures", { p_filters: filters })
  if (error) {
    console.warn("front_office_departures failed:", error.message)
    return []
  }
  return Array.isArray(data) ? data : []
}

export async function getInHouseGuests(filters = {}) {
  const { data, error } = await supabase.rpc("front_office_in_house", { p_filters: filters })
  if (error) {
    console.warn("front_office_in_house failed:", error.message)
    return []
  }
  return Array.isArray(data) ? data : []
}

export async function getRoomRack() {
  const { data, error } = await supabase.rpc("front_office_room_rack")
  if (error) {
    console.warn("front_office_room_rack failed:", error.message)
    return []
  }
  return Array.isArray(data) ? data : []
}
