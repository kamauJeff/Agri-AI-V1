import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import {
  getPrices,
  getLatestPrices,
  getCrops,
  getCounties,
  getPriceTrend,
  createPrice,
} from '../controllers/market.controller'

export const marketRouter = Router()

marketRouter.use(authenticate)

marketRouter.get('/prices', getPrices)
marketRouter.get('/prices/latest', getLatestPrices)
marketRouter.get('/prices/:crop/trend', getPriceTrend)
marketRouter.get('/crops', getCrops)
marketRouter.get('/counties', getCounties)
marketRouter.post('/prices', requireRole('ADMIN'), createPrice)
