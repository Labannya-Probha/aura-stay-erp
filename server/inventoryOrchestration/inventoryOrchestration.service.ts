import { createHash } from 'node:crypto'
import { supabaseAdmin } from '../middleware/auth.js'

type ModuleCode = 'POS' | 'SALES' | 'CONSUMPTION'

type IdempotencyStatus = 'PROCESSING' | 'SUCCEEDED' | 'FAILED'

type AuthUser = {
  id: string
  email: string
  tenantId: string
  role: string
}

interface IdempotencyRecord {
  request_hash: string
  status: IdempotencyStatus
  http_status?: number | null
  response_payload?: Record<string, unknown> | null
  error_payload?: { message?: string } | null
}

interface IdempotencyRunParams {
  tenantId: string
  moduleCode: ModuleCode
  operationCode: string
  idempotencyKey: string
  requestPayload: Record<string, unknown>
  requestId?: string
  authUser?: Partial<AuthUser>
  auditContext?: {
    entityType?: string | null
    entityId?: string | null
    referenceType?: string | null
    referenceId?: string | null
  }
  run: () => Promise<Record<string, unknown>>
}

interface IdempotencyRunResult {
  replayed: boolean
  statusCode: number
  payload: Record<string, unknown>
}

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`

  const objectValue = value as Record<string, unknown>
  const keys = Object.keys(objectValue).sort()
  const kv = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`)
  return `{${kv.join(',')}}`
}

const hashRequest = (payload: Record<string, unknown>): string => {
  return createHash('sha256').update(stableStringify(payload)).digest('hex')
}

const buildHttpError = (
  message: string,
  status = 400,
): Error & { status: number; code: number } => {
  const error = new Error(message) as Error & { status: number; code: number }
  error.status = status
  error.code = status
  return error
}

export class InventoryOrchestrationServiceTs {
  async withIdempotency(params: IdempotencyRunParams): Promise<IdempotencyRunResult> {
    const requestHash = hashRequest(params.requestPayload)
    const existing = await this.getIdempotencyRecord(params)

    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw buildHttpError('Idempotency key already used with a different payload.', 409)
      }

      if (existing.status === 'SUCCEEDED') {
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
        )
      }

      throw buildHttpError('Request with this idempotency key is still processing.', 409)
    }

    return {
      replayed: false,
      statusCode: 200,
      payload: await params.run(),
    }
  }

  private async getIdempotencyRecord(
    params: IdempotencyRunParams,
  ): Promise<IdempotencyRecord | null> {
    const { data, error } = await supabaseAdmin
      .from('orchestration_idempotency_keys')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('module_code', params.moduleCode)
      .eq('operation_code', params.operationCode)
      .eq('idempotency_key', params.idempotencyKey)
      .maybeSingle()

    if (error) throw buildHttpError(error.message || 'Failed to read idempotency state.', 500)
    return (data as IdempotencyRecord | null) ?? null
  }
}

export const inventoryOrchestrationServiceTs = new InventoryOrchestrationServiceTs()
