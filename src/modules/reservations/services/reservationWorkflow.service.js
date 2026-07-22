import { supabase } from "../../../lib/supabase"
import { withTenantInsert, withTenantScope } from "../../../lib/companySettings"
import {
  buildAmendmentSnapshot,
  diffReservationSnapshot,
  resolveWorkflowTargetStatus,
} from "../domain/reservationWorkflow"

function ensureSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.")
}

export async function executeReservationAction({ reservation, action, reason, metadata = {} }) {
  ensureSupabase()
  if (!reservation?.id) throw new Error("Reservation is required.")

  const nextStatus = resolveWorkflowTargetStatus(action, reservation.status)
  const { data, error } = await supabase.rpc("execute_reservation_workflow_action", {
    p_reservation_id: reservation.id,
    p_action: action,
    p_next_status: nextStatus,
    p_reason: reason || null,
    p_metadata: metadata,
  })
  if (error) throw error
  return data
}

export async function createReservationAmendment({ reservation, changes, reason, amendmentType = "GENERAL" }) {
  ensureSupabase()
  if (!reservation?.id) throw new Error("Reservation is required.")
  if (!String(reason || "").trim()) throw new Error("Amendment reason is required.")

  const before = buildAmendmentSnapshot(reservation)
  const after = { ...before, ...changes }
  const changeSet = diffReservationSnapshot(before, after)
  if (Object.keys(changeSet).length === 0) throw new Error("No reservation changes detected.")

  const { data, error } = await supabase.rpc("amend_reservation", {
    p_reservation_id: reservation.id,
    p_amendment_type: amendmentType,
    p_reason: reason,
    p_before: before,
    p_after: after,
    p_changes: changeSet,
  })
  if (error) throw error
  return data
}

export async function requestReservationApproval(input) {
  ensureSupabase()
  const record = withTenantInsert({
    reservation_id: input.reservationId,
    approval_type: input.approvalType,
    requested_value: input.requestedValue || {},
    reason: String(input.reason || "").trim(),
    status: "PENDING",
  })
  if (!record.reason) throw new Error("Approval reason is required.")

  const { data, error } = await supabase.from("reservation_approvals").insert(record).select("*").single()
  if (error) throw error
  return data
}

export async function decideReservationApproval(approvalId, decision, note = "") {
  ensureSupabase()
  const normalized = String(decision || "").toUpperCase()
  if (!["APPROVED", "REJECTED"].includes(normalized)) throw new Error("Invalid approval decision.")

  const { data, error } = await withTenantScope(
    supabase
      .from("reservation_approvals")
      .update({ status: normalized, decision_note: note || null, decided_at: new Date().toISOString(), decided_by: (await supabase.auth.getUser()).data.user?.id || null })
      .eq("id", approvalId)
      .select("*")
  ).single()
  if (error) throw error
  return data
}

export async function listPendingReservationApprovals() {
  ensureSupabase()
  const { data, error } = await withTenantScope(
    supabase.from("reservation_approvals").select("*").eq("status", "PENDING").order("created_at", { ascending: false })
  )
  if (error) throw error
  return data || []
}
