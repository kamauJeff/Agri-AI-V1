import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './error.middleware'
import { prisma } from '../utils/prisma'

export interface JwtPayload {
  userId: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload
    req.user = payload
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401, 'TOKEN_INVALID'))
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'))
    }
    next()
  }
}

export function validate(schema: { parse: (data: unknown) => unknown }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err: any) {
      const details: Record<string, string[]> = {}
      if (err?.errors) {
        for (const issue of err.errors) {
          const field = issue.path.join('.') || 'root'
          details[field] = [...(details[field] ?? []), issue.message]
        }
      }
      next(
        Object.assign(new AppError('Validation failed', 422, 'VALIDATION_ERROR'), {
          details,
        }),
      )
    }
  }
}

export function validateQuery(schema: { parse: (data: unknown) => unknown }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any
      next()
    } catch (err: any) {
      next(new AppError('Invalid query parameters', 422, 'VALIDATION_ERROR'))
    }
  }
}
