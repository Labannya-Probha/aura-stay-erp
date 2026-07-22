import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

// Mock the Supabase client used inside server/middleware/auth.js so this test
// runs without a live Supabase connection or real credentials.
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async (token) => {
        if (token === 'valid-token') {
          return { data: { user: { id: 'u1', email: 'demo@aura-stay.local' } }, error: null }
        }
        return { data: null, error: new Error('invalid') }
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { role: 'ADMIN', tenant_id: 't1' },
            error: null,
          }),
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

describe('Reporting API authentication', () => {
  it('returns 401 with no Authorization header at all', async () => {
    const res = await request(app).get('/api/reports')
    expect(res.status).toBe(401)
  })

  it('returns 401 with an invalid/garbage bearer token', async () => {
    const res = await request(app).get('/api/reports').set('Authorization', 'Bearer garbage')
    expect(res.status).toBe(401)
  })

  it('returns 200 with a valid token that resolves to a real app_users row', async () => {
    const res = await request(app).get('/api/reports').set('Authorization', 'Bearer valid-token')
    expect(res.status).toBe(200)
  })

  // Regression test for the original vulnerability: the API used to build its
  // "current user" entirely from client-supplied headers, defaulting role to
  // SUPERUSER when x-user-role was absent. This must NEVER pass again —
  // headers alone, without a verified bearer token, must always be rejected.
  it('never grants access via x-user-role/x-user-id headers without a valid bearer token', async () => {
    const res = await request(app)
      .get('/api/reports')
      .set('x-user-role', 'SUPERUSER')
      .set('x-user-id', 'anyone')
    expect(res.status).toBe(401)
  })

  it('never grants access via x-user-role header even alongside an invalid token', async () => {
    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', 'Bearer garbage')
      .set('x-user-role', 'SUPERUSER')
    expect(res.status).toBe(401)
  })
})
