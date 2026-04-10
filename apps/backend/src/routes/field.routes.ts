import { Router } from 'express'
import { authenticate, validate } from '../middleware/auth.middleware'
import { CreateFieldSchema, UpdateFieldSchema } from '@agriai/shared'
import {
  getFields,
  getField,
  createField,
  updateField,
  deleteField,
} from '../controllers/field.controller'

export const fieldRouter = Router()

fieldRouter.use(authenticate)

fieldRouter.get('/:farmId/fields', getFields)
fieldRouter.get('/:farmId/fields/:id', getField)
fieldRouter.post('/:farmId/fields', validate(CreateFieldSchema), createField)
fieldRouter.patch('/:farmId/fields/:id', validate(UpdateFieldSchema), updateField)
fieldRouter.delete('/:farmId/fields/:id', deleteField)
