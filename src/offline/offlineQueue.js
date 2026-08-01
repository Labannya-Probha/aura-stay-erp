import { dbDelete, dbGetAll, dbPut } from "./indexedDb"
import { supabase } from "@/lib/supabaseClient"
import { getTenantId } from "@/lib/tenant"

const MAX_RETRIES = 5
// Exponential backoff in ms: 2s, 4s, 8s, 16s, 32s
const BACKOFF_BASE_MS = 2000

// Entities whose table actually has an idempotency_key column with a
// unique constraint. Only these get the key stamped onto the insert
// payload and checked before retry — sending an unknown column to any
// other entity would fail the insert outright, so this list must stay in
// sync with schema migrations that add the column to additional tables.
// Currently: pos_orders only (2026-08-01 migration).
const IDEMPOTENCY_SUPPORTED_ENTITIES = new Set(["pos_orders"])

/**
 * Fixes applied (audit finding O-001 — the previous version had no
 * idempotency key, no tenant binding, no retry limit, and no pre-retry
 * reconciliation, creating a real risk of duplicate financial postings
 * on network failure):
 *
 *   1. Idempotency key: for supported entities, every queued item gets a
 *      client-generated `idempotency_key` (crypto.randomUUID()) stamped
 *      once at enqueue time and reused on every retry — never
 *      regenerated. A server-side unique constraint rejects a true
 *      duplicate insert outright, and the pre-retry reconciliation check
 *      (below) distinguishes "already synced, client just didn't get the
 *      response" from "genuinely never synced".
 *   2. Tenant binding: `tenant_id` is stamped from the current session at
 *      enqueue time and re-verified at sync time — an item queued under
 *      one tenant can never be synced under a different one (e.g. after
 *      a tenant switch on a shared device).
 *   3. Retry count + exponential backoff: previously a failed item was
 *      retried on every sync pass with no limit. Now capped at
 *      MAX_RETRIES with exponential backoff between attempts.
 *   4. Pre-retry reconciliation: before retrying an insert on a supported
 *      entity, checks whether a row with this idempotency_key already
 *      exists server-side (covers the exact failure mode where the
 *      insert succeeded but the client never received confirmation
 *      before going offline again) — if found, marks the local item
 *      synced instead of blindly re-inserting.
 */
export async function addToSyncQueue({ entity, action, payload }) {
  const tenantId = getTenantId()
  const supportsIdempotency = IDEMPOTENCY_SUPPORTED_ENTITIES.has(entity)

  return dbPut("sync_queue", {
    entity,
    action,
    payload,
    idempotency_key: supportsIdempotency ? crypto.randomUUID() : null,
    tenant_id: tenantId,
    status: "PENDING",
    retry_count: 0,
    created_at: new Date().toISOString(),
    next_retry_at: new Date().toISOString(),
  })
}

function backoffDelayMs(retryCount) {
  return BACKOFF_BASE_MS * Math.pow(2, retryCount)
}

async function alreadySyncedServerSide(entity, idempotencyKey) {
  if (!idempotencyKey || !IDEMPOTENCY_SUPPORTED_ENTITIES.has(entity)) return false
  const { data, error } = await supabase
    .from(entity)
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle()
  // Treat lookup errors as "unknown, proceed with normal insert" rather
  // than blocking sync entirely.
  if (error) return false
  return Boolean(data)
}

export async function syncPendingQueue() {
  if (!navigator.onLine) return

  const currentTenantId = getTenantId()
  const queue = await dbGetAll("sync_queue")
  const now = Date.now()

  const due = queue.filter((item) => {
    if (item.status !== "PENDING" && item.status !== "FAILED") return false
    if ((item.retry_count || 0) >= MAX_RETRIES) return false
    const nextRetryAt = item.next_retry_at ? new Date(item.next_retry_at).getTime() : 0
    return nextRetryAt <= now
  })

  for (const item of due) {
    // Tenant binding: refuse to sync an item queued under a different
    // tenant than the one currently signed in.
    if (item.tenant_id && item.tenant_id !== currentTenantId) {
      await dbPut("sync_queue", {
        ...item,
        status: "TENANT_MISMATCH",
        error_message: "Queued under a different tenant than the current session",
      })
      continue
    }

    try {
      if (item.action === "INSERT") {
        const alreadyExists = await alreadySyncedServerSide(item.entity, item.idempotency_key)
        if (alreadyExists) {
          await dbDelete("sync_queue", item.id)
          continue
        }

        const supportsIdempotency = IDEMPOTENCY_SUPPORTED_ENTITIES.has(item.entity)
        const insertPayload = supportsIdempotency
          ? { ...item.payload, idempotency_key: item.idempotency_key }
          : item.payload

        const { error } = await supabase.from(item.entity).insert(insertPayload)
        if (error) throw error
      }

      if (item.action === "UPDATE") {
        const { id, ...payload } = item.payload
        const { error } = await supabase.from(item.entity).update(payload).eq("id", id)
        if (error) throw error
      }

      await dbDelete("sync_queue", item.id)
    } catch (error) {
      const nextRetryCount = (item.retry_count || 0) + 1
      await dbPut("sync_queue", {
        ...item,
        status: nextRetryCount >= MAX_RETRIES ? "FAILED_PERMANENT" : "FAILED",
        retry_count: nextRetryCount,
        next_retry_at: new Date(now + backoffDelayMs(nextRetryCount)).toISOString(),
        error_message: error.message,
        failed_at: new Date().toISOString(),
      })
    }
  }
}
