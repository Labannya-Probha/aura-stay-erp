import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import usersRoutes from './routes/users.js'

const app = express()
const port = Number(process.env.IAM_PORT || 4100)

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.set('trust proxy', 1)
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
      return callback(new Error(`Origin ${origin} is not allowed`))
    },
  }),
)
app.use(rateLimit({ windowMs: 60_000, max: 60 })) // stricter than the main API — this issues credentials
app.use(express.json({ limit: '200kb' }))

app.use('/iam', usersRoutes)

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'aura-iam', time: new Date().toISOString() })
})

app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ error: error.message || 'IAM service failed' })
})

app.listen(port, () => {
  console.log(`Aura IAM service listening on :${port}`)
})
