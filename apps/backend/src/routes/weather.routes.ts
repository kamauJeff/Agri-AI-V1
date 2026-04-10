import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getForecast, getAlerts } from '../controllers/weather.controller'

export const weatherRouter = Router()

weatherRouter.use(authenticate)
weatherRouter.get('/:farmId/forecast', getForecast)
weatherRouter.get('/:farmId/alerts', getAlerts)
