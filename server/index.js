import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import reportingRoutes from './reporting/routes.js'
import posPrintRoutes from './posPrint/routes.js'

const app = express()
const port = Number(process.env.PORT || 4000)

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (ALLOWED_ORIGINS.length === 0) {
  console.warn('[WARN] ALLOWED_ORIGINS is empty - no browser origin will be permitted.')
}

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    return callback(new Error(`Origin ${origin} is not allowed`))
  },
  credentials: true,
}))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', code: 429 },
}))

app.use(express.json({ limit: '2mb' }))
app.use('/api', reportingRoutes)
app.use('/api', posPrintRoutes)

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'aura-stay-reporting-api', time: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`Aura Stay reporting API listening on :${port}`)
})
