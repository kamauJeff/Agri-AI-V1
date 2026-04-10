import { Router } from 'express'
import { authenticate, requireRole, validate } from '../middleware/auth.middleware'
import { LoanApplicationSchema } from '@agriai/shared'
import { z } from 'zod'
import {
  applyForLoan,
  getLoans,
  getLoan,
  approveLoan,
  disburseLoan,
  recordRepayment,
} from '../controllers/loan.controller'

export const loanRouter = Router()

loanRouter.use(authenticate)

loanRouter.get('/', getLoans)
loanRouter.get('/:id', getLoan)
loanRouter.post('/apply', validate(LoanApplicationSchema), applyForLoan)
loanRouter.post('/:id/repay', validate(z.object({ amountKes: z.number().positive(), reference: z.string().optional() })), recordRepayment)

// Admin only
loanRouter.post('/:id/approve', requireRole('ADMIN'), approveLoan)
loanRouter.post('/:id/disburse', requireRole('ADMIN'), disburseLoan)
