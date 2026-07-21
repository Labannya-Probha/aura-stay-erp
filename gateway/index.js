import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { requireAuth } from '../server/middleware/auth.js'

const app = express()
const port = Number(process.env.GATEWAY_PORT || 8080)

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    return callback(new Error(`Origin ${origin} is not allowed`))
  },
  credentials: true,
}))
app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }))

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'aura-gateway', time: new Date().toISOString() })
})

app.use(requireAuth())
app.use((req, res, next) => {
  req.headers['x-verified-user-id'] = req.authUser.id
  req.headers['x-verified-tenant-id'] = req.authUser.tenantId
  req.headers['x-verified-role'] = req.authUser.role
  next()
})

app.use('/resort', createProxyMiddleware({
  target: process.env.RESORT_SERVICE_URL || 'http://localhost:4000',
  changeOrigin: true,
  pathRewrite: (path) => {
    if (path === '/api' || path.startsWith('/api/')) return path
    return `/api${path}`
  },
  on: {
    proxyReq: (proxyReq, req) => {
      const auth = req.headers.authorization || req.headers.Authorization
      if (auth) proxyReq.setHeader('Authorization', auth)
    },
  },
}))

app.listen(port, () => {
  console.log(`Aura Gateway listening on :${port}`)
})
