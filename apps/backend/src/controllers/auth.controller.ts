import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiresAt,
} from '../services/jwt.service'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

// POST /api/auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, phone, email, password, role } = req.body

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    })
    if (existing) {
      throw new AppError('Phone or email already registered', 409, 'DUPLICATE')
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, phone, email: email || null, passwordHash, role },
      select: { id: true, name: true, phone: true, email: true, role: true },
    })

    const payload = { userId: user.id, role: user.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: refreshTokenExpiresAt() },
    })

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)

    res.status(201).json({
      success: true,
      data: { user, tokens: { accessToken } },
      message: 'Registration successful',
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, password } = req.body

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true, name: true, phone: true, email: true,
        role: true, passwordHash: true, isActive: true,
      },
    })

    if (!user || !user.isActive) {
      throw new AppError('Invalid phone or password', 401, 'INVALID_CREDENTIALS')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw new AppError('Invalid phone or password', 401, 'INVALID_CREDENTIALS')
    }

    const payload = { userId: user.id, role: user.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: refreshTokenExpiresAt() },
    })

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)

    const { passwordHash: _, ...safeUser } = user

    res.json({
      success: true,
      data: { user: safeUser, tokens: { accessToken } },
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken
    if (!token) throw new AppError('Refresh token required', 401, 'UNAUTHORIZED')

    const stored = await prisma.refreshToken.findUnique({ where: { token } })
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID')
    }

    let payload: { userId: string; role: string }
    try {
      payload = verifyRefreshToken(token)
    } catch {
      throw new AppError('Invalid refresh token', 401, 'TOKEN_INVALID')
    }

    // Rotate: revoke old, issue new
    const [, newRefreshToken] = await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: payload.userId,
          token: signRefreshToken(payload),
          expiresAt: refreshTokenExpiresAt(),
        },
      }),
    ])

    res.cookie('refreshToken', newRefreshToken.token, COOKIE_OPTS)

    res.json({
      success: true,
      data: { tokens: { accessToken: signAccessToken(payload) } },
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken
    if (token) {
      await prisma.refreshToken
        .update({ where: { token }, data: { revokedAt: new Date() } })
        .catch(() => {}) // ignore if already revoked
    }
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
    })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/auth/me
export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email } = req.body
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { ...(name && { name }), ...(email && { email }) },
      select: { id: true, name: true, phone: true, email: true, role: true },
    })
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/change-password
export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404)

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS')

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

    // Revoke all refresh tokens (force re-login everywhere)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Password changed. Please log in again.' })
  } catch (err) {
    next(err)
  }
}
