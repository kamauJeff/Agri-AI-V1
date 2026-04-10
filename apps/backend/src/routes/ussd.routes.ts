import { Router } from 'express'
import { handleUssd } from '../controllers/ussd.controller'

export const ussdRouter = Router()

// Africa's Talking POSTs form-encoded data
ussdRouter.post('/', handleUssd)
