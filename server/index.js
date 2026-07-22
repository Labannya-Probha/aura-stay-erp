import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import console from 'node:console'
import process from 'node:process'
import reportingRoutes from './reporting/routes.js'
import posPrintRoutes from './posPrint/routes.js'
import moneyReceiptRoutes from './moneyReceipt/routes.js'
import { requestContext } from './middleware/requestContext.js'
import { errorHandler, initErrorTracking } from './middleware/errorTracking.js'
import { initTelemetry, shutdownTelemetry } from './observability/telemetry.js'

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
app.use(requestContext)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
      return callback(new Error(`Origin ${origin} is not allowed`))
    },
    credentials: true,
  }),
)

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.', code: 429 },
  }),
)

app.use(express.json({ limit: '2mb' }))
app.use('/api', reportingRoutes)
app.use('/api', posPrintRoutes)
app.use('/api', moneyReceiptRoutes)

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'aura-stay-reporting-api', time: new Date().toISOString() })
})

app.use(errorHandler())

async function bootstrap() {
  await initTelemetry()
  await initErrorTracking()

  const server = app.listen(port, () => {
    console.log(`Aura Stay reporting API listening on :${port}`)
  })

  const gracefulShutdown = async () => {
    console.log('Shutting down API server...')
    server.close(async () => {
      await shutdownTelemetry()
      process.exit(0)
    })
  }

  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
}

bootstrap().catch((error) => {
  console.error('Server bootstrap failed:', error)
  process.exit(1)
})
