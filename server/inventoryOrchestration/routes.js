import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { inventoryOrchestrationService } from './inventoryOrchestration.service.js'

const router = express.Router()

router.use(requireAuth())

function getIdempotencyKey(req) {
  const raw = req.get('idempotency-key') || req.get('Idempotency-Key')
  const key = String(raw || '').trim()
  if (!key || key.length < 8 || key.length > 128) {
    const error = new Error('Idempotency-Key header is required (8-128 characters).')
    error.status = 400
    error.code = 400
    throw error
  }
  return key
}

function toNumber(value, name) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) {
    const error = new Error(`${name} must be a number > 0.`)
    error.status = 400
    error.code = 400
    throw error
  }
  return n
}

function requiredString(value, name) {
  const v = String(value || '').trim()
  if (!v) {
    const error = new Error(`${name} is required.`)
    error.status = 400
    error.code = 400
    throw error
  }
  return v
}

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (error) {
    next(error)
  }
}

async function runIdempotent(req, res, { moduleCode, operationCode, entityType, run }) {
  const idempotencyKey = getIdempotencyKey(req)
  const tenantId = req.authUser.tenantId
  const requestPayload = req.body || {}

  const result = await inventoryOrchestrationService.withIdempotency({
    tenantId,
    moduleCode,
    operationCode,
    idempotencyKey,
    requestPayload,
    requestId: req.requestId,
    authUser: req.authUser,
    auditContext: {
      entityType,
      entityId: requestPayload?.referenceId || requestPayload?.entityId || null,
      referenceType: requestPayload?.referenceType || null,
      referenceId: requestPayload?.referenceId || null,
    },
    run,
  })

  res
    .status(result.statusCode)
    .set('x-idempotent-replay', result.replayed ? 'true' : 'false')
    .json({
      ok: true,
      requestId: req.requestId,
      idempotencyKey,
      replayed: result.replayed,
      module: moduleCode,
      operation: operationCode,
      result: result.payload,
    })
}

router.post(
  '/orchestration/pos/consume',
  asyncRoute(async (req, res) => {
    const itemId = requiredString(req.body?.itemId, 'itemId')
    const warehouse = requiredString(req.body?.warehouse, 'warehouse')
    const qty = toNumber(req.body?.qty, 'qty')

    await runIdempotent(req, res, {
      moduleCode: 'POS',
      operationCode: 'POS_STOCK_CONSUME',
      entityType: 'pos_order_line',
      run: () =>
        inventoryOrchestrationService.consumeForPos({
          tenantId: req.authUser.tenantId,
          postedBy: req.authUser.email,
          itemId,
          warehouse,
          qty,
          referenceId: req.body?.referenceId,
          referenceLineId: req.body?.referenceLineId,
          narration: req.body?.narration,
          postedAt: req.body?.postedAt,
        }),
    })
  }),
)

router.post(
  '/orchestration/sales/consume',
  asyncRoute(async (req, res) => {
    const itemId = requiredString(req.body?.itemId, 'itemId')
    const warehouse = requiredString(req.body?.warehouse, 'warehouse')
    const qty = toNumber(req.body?.qty, 'qty')

    await runIdempotent(req, res, {
      moduleCode: 'SALES',
      operationCode: 'SALES_STOCK_CONSUME',
      entityType: 'sales_invoice_line',
      run: () =>
        inventoryOrchestrationService.consumeForSales({
          tenantId: req.authUser.tenantId,
          postedBy: req.authUser.email,
          itemId,
          warehouse,
          qty,
          referenceId: req.body?.referenceId,
          referenceLineId: req.body?.referenceLineId,
          narration: req.body?.narration,
          postedAt: req.body?.postedAt,
        }),
    })
  }),
)

router.post(
  '/orchestration/consumption/consume',
  asyncRoute(async (req, res) => {
    const itemId = requiredString(req.body?.itemId, 'itemId')
    const warehouse = requiredString(req.body?.warehouse, 'warehouse')
    const qty = toNumber(req.body?.qty, 'qty')

    await runIdempotent(req, res, {
      moduleCode: 'CONSUMPTION',
      operationCode: 'CONSUMPTION_STOCK_ISSUE',
      entityType: 'consumption_line',
      run: () =>
        inventoryOrchestrationService.consumeForConsumption({
          tenantId: req.authUser.tenantId,
          postedBy: req.authUser.email,
          itemId,
          warehouse,
          qty,
          referenceId: req.body?.referenceId,
          referenceLineId: req.body?.referenceLineId,
          narration: req.body?.narration,
          postedAt: req.body?.postedAt,
        }),
    })
  }),
)

router.post(
  '/orchestration/consumption/receive',
  asyncRoute(async (req, res) => {
    const itemId = requiredString(req.body?.itemId, 'itemId')
    const warehouse = requiredString(req.body?.warehouse, 'warehouse')
    const qty = toNumber(req.body?.qty, 'qty')
    const unitCost = toNumber(req.body?.unitCost, 'unitCost')

    await runIdempotent(req, res, {
      moduleCode: 'CONSUMPTION',
      operationCode: 'CONSUMPTION_STOCK_RECEIPT',
      entityType: 'consumption_return_line',
      run: () =>
        inventoryOrchestrationService.receiveForConsumption({
          tenantId: req.authUser.tenantId,
          postedBy: req.authUser.email,
          itemId,
          warehouse,
          qty,
          unitCost,
          referenceId: req.body?.referenceId,
          referenceLineId: req.body?.referenceLineId,
          narration: req.body?.narration,
          postedAt: req.body?.postedAt,
        }),
    })
  }),
)

export default router
