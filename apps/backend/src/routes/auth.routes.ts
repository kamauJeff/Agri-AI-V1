import { Router } from 'express'
import { authenticate, validate } from '../middleware/auth.middleware'
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
} from '@agriai/shared'
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  changePassword,
} from '../controllers/auth.controller'

export const authRouter = Router()

authRouter.post('/register', validate(RegisterSchema), register)
authRouter.post('/login', validate(LoginSchema), login)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logout)

authRouter.get('/me', authenticate, me)
authRouter.patch('/me', authenticate, updateMe)
authRouter.post('/change-password', authenticate, changePassword)
