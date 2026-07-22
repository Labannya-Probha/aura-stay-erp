import { createHash } from 'node:crypto'
import { supabaseAdmin } from '../middleware/auth.js'

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`

  const keys = Object.keys(value).sort()
  const kv = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
  return `{${kv.join(',')}}`
}

function hashRequest(payload) {
  return createHash('sha256').update(stableStringify(payload)).digest('hex')
}

function buildHttpError(message, status = 400, code = status) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

export class InventoryOrchestrationService {
  async withIdempotency({
    tenantId,
    moduleCode,
    operationCode,
    idempotencyKey,
    requestPayload,
    requestId,
    authUser,
    run,
    auditContext = {},
  }) {
    const requestHash = hashRequest(requestPayload)
    const existing = await this._getIdempotencyRecord({
      tenantId,
      moduleCode,
      operationCode,
      idempotencyKey,
    })

    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw buildHttpError('Idempotency key already used with a different payload.', 409, 409)
      }

      if (existing.status === 'SUCCEEDED') {
        await this._writeAuditLog({
          tenantId,
          requestId,
          idempotencyKey,
          moduleCode,
          operationCode,
          authUser,
          outcome: 'REPLAYED',
          statusCode: existing.http_status || 200,
          requestPayload,
          responsePayload: existing.response_payload || {},
          ...auditContext,
        })

        return {
          replayed: true,
          statusCode: existing.http_status || 200,
          payload: existing.response_payload || {},
        }
      }

      if (existing.status === 'FAILED') {
        throw buildHttpError(
          existing.error_payload?.message || 'Previous idempotent request failed.',
          Number(existing.http_status || 409),
          Number(existing.http_status || 409),
        )
      }

      throw buildHttpError('Request with this idempotency key is still processing.', 409, 409)
    }

    const created = await this._insertIdempotencyRecord({
      tenantId,
      moduleCode,
      operationCode,
      idempotencyKey,
      requestHash,
      requestPayload,
      requestId,
      authUser,
    })

    if (!created) {
      const raced = await this._getIdempotencyRecord({
        tenantId,
        moduleCode,
        operationCode,
        idempotencyKey,
      })
      if (raced?.request_hash !== requestHash) {
        throw buildHttpError('Idempotency key already used with a different payload.', 409, 409)
      }
      if (raced?.status === 'SUCCEEDED') {
        await this._writeAuditLog({
          tenantId,
          requestId,
          idempotencyKey,
          moduleCode,
          operationCode,
          authUser,
          outcome: 'REPLAYED',
          statusCode: raced.http_status || 200,
          requestPayload,
          responsePayload: raced.response_payload || {},
          ...auditContext,
        })
        return {
          replayed: true,
          statusCode: raced.http_status || 200,
          payload: raced.response_payload || {},
        }
      }
      throw buildHttpError(
        'Request with this idempotency key is already being processed.',
        409,
        409,
      )
    }

    const startedAt = process.hrtime.bigint()

    try {
      const payload = await run()
      const statusCode = 200

      await this._markIdempotencySuccess({
        tenantId,
        moduleCode,
        operationCode,
        idempotencyKey,
        statusCode,
        payload,
      })

      await this._writeAuditLog({
        tenantId,
        requestId,
        idempotencyKey,
        moduleCode,
        operationCode,
        authUser,
        outcome: 'SUCCESS',
        statusCode,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
        requestPayload,
        responsePayload: payload,
        ...auditContext,
      })

      return { replayed: false, statusCode, payload }
    } catch (error) {
      const statusCode = Number(error.status || error.code || 500)
      const safeError = { message: error.message || 'Operation failed', statusCode }

      await this._markIdempotencyFailure({
        tenantId,
        moduleCode,
        operationCode,
        idempotencyKey,
        statusCode,
        errorPayload: safeError,
      })

      await this._writeAuditLog({
        tenantId,
        requestId,
        idempotencyKey,
        moduleCode,
        operationCode,
        authUser,
        outcome: 'FAILED',
        statusCode,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
        requestPayload,
        errorPayload: safeError,
        ...auditContext,
      })

      throw error
    }
  }

  async consumeForPos({
    tenantId,
    postedBy,
    itemId,
    warehouse,
    qty,
    referenceId,
    referenceLineId,
    narration,
    postedAt,
  }) {
    const { data, error } = await supabaseAdmin.rpc('inventory_issue_cost', {
      p_tenant_id: tenantId,
      p_item_id: itemId,
      p_warehouse: warehouse,
      p_qty: qty,
      p_reference_type: 'POS_SALE',
      p_reference_id: referenceId || null,
      p_reference_line_id: referenceLineId || null,
      p_posted_by: postedBy || null,
      p_post_to_cogs: true,
      p_narration: narration || null,
      p_posted_at: postedAt || null,
      p_movement_type: 'OUTBOUND',
    })
    if (error) throw buildHttpError(error.message || 'POS valuation failed.', 400, 400)
    return data
  }

  async consumeForSales({
    tenantId,
    postedBy,
    itemId,
    warehouse,
    qty,
    referenceId,
    referenceLineId,
    narration,
    postedAt,
  }) {
    const { data, error } = await supabaseAdmin.rpc('inventory_issue_cost', {
      p_tenant_id: tenantId,
      p_item_id: itemId,
      p_warehouse: warehouse,
      p_qty: qty,
      p_reference_type: 'SALE_INVOICE',
      p_reference_id: referenceId || null,
      p_reference_line_id: referenceLineId || null,
      p_posted_by: postedBy || null,
      p_post_to_cogs: true,
      p_narration: narration || null,
      p_posted_at: postedAt || null,
      p_movement_type: 'OUTBOUND',
    })
    if (error) throw buildHttpError(error.message || 'Sales valuation failed.', 400, 400)
    return data
  }

  async consumeForConsumption({
    tenantId,
    postedBy,
    itemId,
    warehouse,
    qty,
    referenceId,
    referenceLineId,
    narration,
    postedAt,
  }) {
    const { data, error } = await supabaseAdmin.rpc('inventory_issue_cost', {
      p_tenant_id: tenantId,
      p_item_id: itemId,
      p_warehouse: warehouse,
      p_qty: qty,
      p_reference_type: 'CONSUMPTION',
      p_reference_id: referenceId || null,
      p_reference_line_id: referenceLineId || null,
      p_posted_by: postedBy || null,
      p_post_to_cogs: true,
      p_narration: narration || null,
      p_posted_at: postedAt || null,
      p_movement_type: 'OUTBOUND',
    })
    if (error) throw buildHttpError(error.message || 'Consumption valuation failed.', 400, 400)
    return data
  }

  async receiveForConsumption({
    tenantId,
    postedBy,
    itemId,
    warehouse,
    qty,
    unitCost,
    referenceId,
    referenceLineId,
    narration,
    postedAt,
  }) {
    const { data, error } = await supabaseAdmin.rpc('inventory_receive_cost', {
      p_tenant_id: tenantId,
      p_item_id: itemId,
      p_warehouse: warehouse,
      p_qty: qty,
      p_unit_cost: unitCost,
      p_reference_type: 'CONSUMPTION_RETURN',
      p_reference_id: referenceId || null,
      p_reference_line_id: referenceLineId || null,
      p_posted_by: postedBy || null,
      p_posted_at: postedAt || null,
      p_movement_type: 'RETURN_TO_STORE',
    })
    if (error)
      throw buildHttpError(error.message || 'Consumption return valuation failed.', 400, 400)
    return {
      ...data,
      narration: narration || null,
    }
  }

  async _getIdempotencyRecord({ tenantId, moduleCode, operationCode, idempotencyKey }) {
    const { data, error } = await supabaseAdmin
      .from('orchestration_idempotency_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('module_code', moduleCode)
      .eq('operation_code', operationCode)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (error) throw buildHttpError(error.message || 'Failed to read idempotency state.', 500, 500)
    return data
  }

  async _insertIdempotencyRecord({
    tenantId,
    moduleCode,
    operationCode,
    idempotencyKey,
    requestHash,
    requestPayload,
    requestId,
    authUser,
  }) {
    const payload = {
      tenant_id: tenantId,
      module_code: moduleCode,
      operation_code: operationCode,
      idempotency_key: idempotencyKey,
      request_hash: requestHash,
      request_payload: requestPayload,
      request_id: requestId,
      status: 'PROCESSING',
      created_by: authUser?.id || null,
      created_by_name: authUser?.email || null,
      locked_at: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin.from('orchestration_idempotency_keys').insert(payload)
    if (!error) return true

    if (
      String(error.message || '')
        .toLowerCase()
        .includes('duplicate') ||
      Number(error.code) === 23505
    ) {
      return false
    }

    throw buildHttpError(error.message || 'Failed to create idempotency record.', 500, 500)
  }

  async _markIdempotencySuccess({
    tenantId,
    moduleCode,
    operationCode,
    idempotencyKey,
    statusCode,
    payload,
  }) {
    const { error } = await supabaseAdmin
      .from('orchestration_idempotency_keys')
      .update({
        status: 'SUCCEEDED',
        http_status: statusCode,
        response_payload: payload,
        error_payload: null,
        completed_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('module_code', moduleCode)
      .eq('operation_code', operationCode)
      .eq('idempotency_key', idempotencyKey)

    if (error)
      throw buildHttpError(
        error.message || 'Failed to finalize idempotency success state.',
        500,
        500,
      )
  }

  async _markIdempotencyFailure({
    tenantId,
    moduleCode,
    operationCode,
    idempotencyKey,
    statusCode,
    errorPayload,
  }) {
    const { error } = await supabaseAdmin
      .from('orchestration_idempotency_keys')
      .update({
        status: 'FAILED',
        http_status: statusCode,
        error_payload: errorPayload,
        completed_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('module_code', moduleCode)
      .eq('operation_code', operationCode)
      .eq('idempotency_key', idempotencyKey)

    if (error) {
      console.error('Failed to persist idempotency failure state', error)
    }
  }

  async _writeAuditLog({
    tenantId,
    requestId,
    idempotencyKey,
    moduleCode,
    operationCode,
    authUser,
    entityType,
    entityId,
    referenceType,
    referenceId,
    outcome,
    statusCode,
    durationMs,
    requestPayload,
    responsePayload,
    errorPayload,
  }) {
    const payload = {
      tenant_id: tenantId,
      request_id: requestId,
      idempotency_key: idempotencyKey,
      module_code: moduleCode,
      operation_code: operationCode,
      actor_user_id: authUser?.id || null,
      actor_email: authUser?.email || null,
      entity_type: entityType || null,
      entity_id: entityId || null,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
      outcome,
      status_code: statusCode || null,
      duration_ms: durationMs ? Number(durationMs.toFixed(2)) : null,
      request_payload: requestPayload || {},
      response_payload: responsePayload || null,
      error_payload: errorPayload || null,
    }

    const { error } = await supabaseAdmin.from('orchestration_audit_logs').insert(payload)
    if (error) {
      console.error('Failed to persist orchestration audit log', error)
    }
  }
}

export const inventoryOrchestrationService = new InventoryOrchestrationService()
