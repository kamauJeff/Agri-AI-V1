import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { authRouter } from './routes/auth.routes'
import { farmRouter } from './routes/farm.routes'
import { fieldRouter } from './routes/field.routes'
import { weatherRouter } from './routes/weather.routes'
import { marketRouter } from './routes/market.routes'
import { creditRouter } from './routes/credit.routes'
import { loanRouter } from './routes/loan.routes'
import { predictionRouter } from './routes/prediction.routes'
import { ussdRouter } from './routes/ussd.routes'
import { errorHandler } from './middleware/error.middleware'
import { notFound } from './middleware/notFound.middleware'

const app = express()
const PORT = process.env.PORT ?? 3000

// ─── Security ────────────────────────────────────────────────────────────────

app.use(helmet())
app.use(cors({
  origin: [
    process.env.FRONTEND_URL ?? 'http://localhost:5173',
    process.env.MOBILE_URL ?? 'exp://localhost:8081',
  ],
  credentials: true,
}))

// ─── Rate limiting ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many attempts, try again in 15 minutes.' },
})

app.use(globalLimiter)

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  })
})

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRouter)
app.use('/api/farms', farmRouter)
app.use('/api/farms', fieldRouter)       // /api/farms/:farmId/fields
app.use('/api/weather', weatherRouter)
app.use('/api/market', marketRouter)
app.use('/api/credit', creditRouter)
app.use('/api/loans', loanRouter)
app.use('/api/predict', predictionRouter)
app.use('/ussd', ussdRouter)             // Africa's Talking posts here

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFound)
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🌱 AgriAI backend running on port ${PORT} [${process.env.NODE_ENV}]`)
})

export default app
