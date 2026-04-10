import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'

// GET /api/farms
export async function getFarms(req: Request, res: Response, next: NextFunction) {
  try {
    const farms = await prisma.farm.findMany({
      where: { userId: req.user!.userId },
      include: {
        fields: { orderBy: { createdAt: 'asc' } },
        _count: { select: { fields: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: farms })
  } catch (err) {
    next(err)
  }
}

// GET /api/farms/:id
export async function getFarm(req: Request, res: Response, next: NextFunction) {
  try {
    const farm = await prisma.farm.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        fields: { orderBy: { createdAt: 'asc' } },
        weatherAlerts: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!farm) throw new AppError('Farm not found', 404, 'NOT_FOUND')
    res.json({ success: true, data: farm })
  } catch (err) {
    next(err)
  }
}

// POST /api/farms
export async function createFarm(req: Request, res: Response, next: NextFunction) {
  try {
    const farm = await prisma.farm.create({
      data: { ...req.body, userId: req.user!.userId },
    })
    res.status(201).json({ success: true, data: farm, message: 'Farm created' })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/farms/:id
export async function updateFarm(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.farm.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!existing) throw new AppError('Farm not found', 404, 'NOT_FOUND')

    const farm = await prisma.farm.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json({ success: true, data: farm })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/farms/:id
export async function deleteFarm(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.farm.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!existing) throw new AppError('Farm not found', 404, 'NOT_FOUND')

    await prisma.farm.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Farm deleted' })
  } catch (err) {
    next(err)
  }
}

// GET /api/farms/summary  (dashboard stats)
export async function getFarmsSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId

    const [farms, totalFields, activeFields] = await Promise.all([
      prisma.farm.findMany({
        where: { userId },
        select: { id: true, totalAreaAcres: true },
      }),
      prisma.field.count({
        where: { farm: { userId } },
      }),
      prisma.field.count({
        where: { farm: { userId }, status: 'PLANTED' },
      }),
    ])

    const totalArea = farms.reduce((sum, f) => sum + f.totalAreaAcres, 0)

    res.json({
      success: true,
      data: {
        totalFarms: farms.length,
        totalFields,
        activeFields,
        totalAreaAcres: totalArea,
      },
    })
  } catch (err) {
    next(err)
  }
}
