import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

const queueGetJobMock = vi.fn()
const queueAddMock = vi.fn()

vi.mock('bullmq', () => ({
  Queue: class {
    constructor() {}
  },
  Worker: class {
    constructor() {}
    on() {}
  },
}))

vi.mock('../../queues/pdfReport.queue.js', () => ({
  pdfReportQueue: {
    getJob: (...args) => queueGetJobMock(...args),
    add: (...args) => queueAddMock(...args),
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async (token) => {
        if (token === 'token-owner') {
          return {
            data: { user: { id: 'u1', email: 'owner@aura-stay.local' } },
            error: null,
          }
        }

        if (token === 'token-other') {
          return {
            data: { user: { id: 'u2', email: 'other@aura-stay.local' } },
            error: null,
          }
        }

        if (token === 'token-super') {
          return {
            data: { user: { id: 'su1', email: 'super@aura-stay.local' } },
            error: null,
          }
        }

        return { data: null, error: new Error('invalid') }
      },
    },
    from: () => ({
      select: () => ({
        eq: (_field, userId) => ({
          single: async () => {
            if (userId === 'u1') {
              return { data: { role: 'ADMIN', tenant_id: 'tenant-001' }, error: null }
            }

            if (userId === 'u2') {
              return { data: { role: 'ADMIN', tenant_id: 'tenant-001' }, error: null }
            }

            if (userId === 'su1') {
              return { data: { role: 'SUPERUSER', tenant_id: 'tenant-super' }, error: null }
            }

            return { data: null, error: new Error('not found') }
          },
        }),
      }),
    }),
  }),
}))

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_ANON_KEY = 'anon-test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'

await import('../middleware/auth.js')
const { default: reportingRoutes } = await import('../reporting/routes.js')

const app = express()
app.use(express.json())
app.use('/api', reportingRoutes)

describe('report export ownership and queue isolation', () => {
  beforeEach(() => {
    queueGetJobMock.mockReset()
    queueAddMock.mockReset()
  })

  it('denies same-tenant non-owner from reading job status', async () => {
    queueGetJobMock.mockResolvedValue({
      id: 'job-001',
      data: {
        tenantId: 'tenant-001',
        requestedBy: 'u1',
        user: { id: 'u1', tenantId: 'tenant-001' },
      },
      getState: vi.fn().mockResolvedValue('completed'),
      returnvalue: { downloadUrl: 'https://example.com/signed.pdf' },
    })

    const response = await request(app)
      .get('/api/reports/jobs/job-001')
      .set('Authorization', 'Bearer token-other')

    expect(response.status).toBe(403)
    expect(response.body.error).toBe('Export job access denied')
  })

  it('allows superuser to read any job status', async () => {
    queueGetJobMock.mockResolvedValue({
      id: 'job-001',
      data: {
        tenantId: 'tenant-001',
        requestedBy: 'u1',
        user: { id: 'u1', tenantId: 'tenant-001' },
      },
      getState: vi.fn().mockResolvedValue('completed'),
      returnvalue: { downloadUrl: 'https://example.com/signed.pdf' },
    })

    const response = await request(app)
      .get('/api/reports/jobs/job-001')
      .set('Authorization', 'Bearer token-super')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('completed')
  })

  it('stores tenant and request ownership metadata when queuing exports', async () => {
    queueAddMock.mockResolvedValue({ id: 'job-202' })

    const response = await request(app)
      .post('/api/reports/RPT-IFRS-PNL/export/pdf')
      .set('Authorization', 'Bearer token-owner')
      .set('User-Agent', 'vitest-suite')
      .send({ filters: { dateFrom: '2026-07-01', dateTo: '2026-07-31' }, tenantId: 'spoofed' })

    expect(response.status).toBe(202)
    expect(queueAddMock).toHaveBeenCalledWith(
      'generate',
      expect.objectContaining({
        reportCode: 'RPT-IFRS-PNL',
        requestedBy: 'u1',
        tenantId: 'tenant-001',
        format: 'pdf',
      }),
    )

    const payload = queueAddMock.mock.calls[0][1]
    expect(payload.params.tenantId).toBe('tenant-001')
    expect(payload.requestMeta.userAgent).toContain('vitest-suite')
  })
})
