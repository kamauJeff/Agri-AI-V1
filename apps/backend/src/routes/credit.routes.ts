import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getCreditScore, refreshCreditScore, getCreditHistory } from '../controllers/credit.controller'

export const creditRouter = Router()

creditRouter.use(authenticate)
creditRouter.get('/score', getCreditScore)
creditRouter.post('/score/refresh', refreshCreditScore)
creditRouter.get('/score/history', getCreditHistory)
