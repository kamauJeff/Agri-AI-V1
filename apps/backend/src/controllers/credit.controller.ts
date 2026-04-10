import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'
import { computeCreditScore } from '../services/credit.service'

// GET /api/credit/score  — get latest score, compute fresh if >24h old
export async function getCreditScore(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const latest = await prisma.creditScore.findFirst({
      where: { userId },
      orderBy: { computedAt: 'desc' },
    })

    const staleThreshold = 24 * 60 * 60 * 1000 // 24h
    const isStale = !latest || Date.now() - latest.computedAt.getTime() > staleThreshold

    if (isStale) {
      const result = await computeCreditScore(userId)
      const fresh = await prisma.creditScore.create({
        data: { userId, ...result },
      })
      return res.json({ success: true, data: fresh, meta: { fresh: true } })
    }

    res.json({ success: true, data: latest, meta: { fresh: false } })
  } catch (err) {
    next(err)
  }
}

// POST /api/credit/score/refresh  — force recompute
export async function refreshCreditScore(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const result = await computeCreditScore(userId)
    const score = await prisma.creditScore.create({ data: { userId, ...result } })
    res.json({ success: true, data: score, message: 'Credit score updated' })
  } catch (err) {
    next(err)
  }
}

// GET /api/credit/score/history
export async function getCreditHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await prisma.creditScore.findMany({
      where: { userId: req.user!.userId },
      orderBy: { computedAt: 'desc' },
      take: 12,
      select: { score: true, rating: true, computedAt: true },
    })
    res.json({ success: true, data: history })
  } catch (err) {
    next(err)
  }
}
