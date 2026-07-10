import { dbDelete, dbGetAll, dbPut } from "./indexedDb"
import { supabase } from "@/lib/supabaseClient"

export async function addToSyncQueue({ entity, action, payload }) {
  return dbPut("sync_queue", {
    entity,
    action,
    payload,
    status: "PENDING",
    created_at: new Date().toISOString(),
  })
}

export async function syncPendingQueue() {
  if (!navigator.onLine) return

  const queue = await dbGetAll("sync_queue")
  const pending = queue.filter((item) => item.status === "PENDING")

  for (const item of pending) {
    try {
      if (item.action === "INSERT") {
        const { error } = await supabase.from(item.entity).insert(item.payload)
        if (error) throw error
      }

      if (item.action === "UPDATE") {
        const { id, ...payload } = item.payload
        const { error } = await supabase.from(item.entity).update(payload).eq("id", id)
        if (error) throw error
      }

      await dbDelete("sync_queue", item.id)
    } catch (error) {
      await dbPut("sync_queue", {
        ...item,
        status: "FAILED",
        error_message: error.message,
        failed_at: new Date().toISOString(),
      })
    }
  }
}