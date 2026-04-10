import { Router } from 'express'
import { authenticate, validate } from '../middleware/auth.middleware'
import { CreateFarmSchema, UpdateFarmSchema } from '@agriai/shared'
import {
  getFarms,
  getFarm,
  createFarm,
  updateFarm,
  deleteFarm,
  getFarmsSummary,
} from '../controllers/farm.controller'

export const farmRouter = Router()

farmRouter.use(authenticate)

farmRouter.get('/summary', getFarmsSummary)
farmRouter.get('/', getFarms)
farmRouter.get('/:id', getFarm)
farmRouter.post('/', validate(CreateFarmSchema), createFarm)
farmRouter.patch('/:id', validate(UpdateFarmSchema), updateFarm)
farmRouter.delete('/:id', deleteFarm)
