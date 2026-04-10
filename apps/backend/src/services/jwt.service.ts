import jwt from 'jsonwebtoken'
import { JwtPayload } from '../middleware/auth.middleware'

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
  })
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
  })
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload
}

export function refreshTokenExpiresAt(): Date {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN ?? '7')
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}
