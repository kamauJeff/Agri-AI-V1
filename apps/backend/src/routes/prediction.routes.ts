import { Router } from 'express'
import { authenticate, validate } from '../middleware/auth.middleware'
import { YieldPredictionSchema } from '@agriai/shared'
import { getPrediction, predictAndSave, getPredictionHistory } from '../controllers/prediction.controller'

export const predictionRouter = Router()

predictionRouter.use(authenticate)
predictionRouter.post('/', validate(YieldPredictionSchema), getPrediction)
predictionRouter.post('/field/:fieldId', predictAndSave)
predictionRouter.get('/field/:fieldId/history', getPredictionHistory)
