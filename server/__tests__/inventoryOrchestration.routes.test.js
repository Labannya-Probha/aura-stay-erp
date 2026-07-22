import { describe, expect, it, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const withIdempotency = vi.fn()

vi.mock('../middleware/auth.js', () => ({
  requireAuth: () => (req, _res, next) => {
    req.authUser = {
      id: 'user-1',
      email: 'ops@aurastay.local',
      tenantId: 'tenant-1',
      role: 'ADMIN',
    }
    req.requestId = 'req-1'
    next()
  },
}))

vi.mock('../inventoryOrchestration/inventoryOrchestration.service.js', () => ({
  inventoryOrchestrationService: {
    withIdempotency,
    consumeForPos: vi.fn(async () => ({ total_cost: 150, journal_entry_id: 'jv-1' })),
    consumeForSales: vi.fn(async () => ({ total_cost: 220, journal_entry_id: 'jv-2' })),
    consumeForConsumption: vi.fn(async () => ({ total_cost: 99, journal_entry_id: 'jv-3' })),
    receiveForConsumption: vi.fn(async () => ({ total_cost: 50 })),
  },
}))

const { default: routes } = await import('../inventoryOrchestration/routes.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api', routes)
  app.use((error, _req, res, _next) => {
    res.status(error.status || 500).json({ error: error.message, code: error.code || 500 })
  })
  return app
}

describe('Inventory orchestration routes', () => {
  beforeEach(() => {
    withIdempotency.mockReset()
  })

  it('rejects consume call without Idempotency-Key header', async () => {
    const app = createApp()

    const res = await request(app)
      .post('/api/orchestration/pos/consume')
      .send({ itemId: 'item-1', warehouse: 'STORE', qty: 1 })

    expect(res.status).toBe(400)
    expect(String(res.body?.error || '')).toContain('Idempotency-Key')
  })

  it('returns orchestration envelope when idempotent call succeeds', async () => {
    const app = createApp()

    withIdempotency.mockResolvedValue({
      replayed: false,
      statusCode: 200,
      payload: { total_cost: 150, journal_entry_id: 'jv-1' },
    })

    const res = await request(app)
      .post('/api/orchestration/pos/consume')
      .set('Idempotency-Key', 'pos-consume-0001')
      .send({ itemId: 'item-1', warehouse: 'STORE', qty: 1, referenceId: 'ord-1' })

    expect(res.status).toBe(200)
    expect(res.body?.ok).toBe(true)
    expect(res.body?.module).toBe('POS')
    expect(res.body?.operation).toBe('POS_STOCK_CONSUME')
    expect(res.body?.result?.journal_entry_id).toBe('jv-1')
  })

  it('marks replayed response with x-idempotent-replay header', async () => {
    const app = createApp()

    withIdempotency.mockResolvedValue({
      replayed: true,
      statusCode: 200,
      payload: { total_cost: 150, journal_entry_id: 'jv-1' },
    })

    const res = await request(app)
      .post('/api/orchestration/pos/consume')
      .set('Idempotency-Key', 'pos-consume-0002')
      .send({ itemId: 'item-1', warehouse: 'STORE', qty: 1, referenceId: 'ord-2' })

    expect(res.status).toBe(200)
    expect(res.headers['x-idempotent-replay']).toBe('true')
  })

  it('returns conflict status from orchestration service', async () => {
    const app = createApp()

    const error = new Error('Idempotency key already used with a different payload.')
    error.status = 409
    error.code = 409
    withIdempotency.mockRejectedValue(error)

    const res = await request(app)
      .post('/api/orchestration/pos/consume')
      .set('Idempotency-Key', 'pos-consume-0003')
      .send({ itemId: 'item-1', warehouse: 'STORE', qty: 1, referenceId: 'ord-3' })

    expect(res.status).toBe(409)
    expect(String(res.body?.error || '')).toContain('different payload')
  })
})
