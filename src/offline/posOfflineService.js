import { dbPut } from "./indexedDb"
import { addToSyncQueue } from "./offlineQueue"

export async function savePosOrderOffline(order) {
  const id = crypto.randomUUID()

  const payload = {
    ...order,
    id,
    order_no: `OFF-POS-${Date.now()}`,
    sync_status: "PENDING",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  await dbPut("pos_orders", payload)

  await addToSyncQueue({
    entity: "pos_orders",
    action: "INSERT",
    payload,
  })

  return payload
}