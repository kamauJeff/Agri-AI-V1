import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'

async function assertFarmOwnership(farmId: string, userId: string) {
  const farm = await prisma.farm.findFirst({ where: { id: farmId, userId } })
  if (!farm) throw new AppError('Farm not found', 404, 'NOT_FOUND')
  return farm
}

// GET /api/farms/:farmId/fields
export async function getFields(req: Request, res: Response, next: NextFunction) {
  try {
    await assertFarmOwnership(req.params.farmId, req.user!.userId)
    const fields = await prisma.field.findMany({
      where: { farmId: req.params.farmId },
      include: {
        yieldPredictions: { take: 1, orderBy: { predictedAt: 'desc' } },
      },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ success: true, data: fields })
  } catch (err) {
    next(err)
  }
}

// GET /api/farms/:farmId/fields/:id
export async function getField(req: Request, res: Response, next: NextFunction) {
  try {
    await assertFarmOwnership(req.params.farmId, req.user!.userId)
    const field = await prisma.field.findFirst({
      where: { id: req.params.id, farmId: req.params.farmId },
      include: {
        yieldPredictions: { orderBy: { predictedAt: 'desc' }, take: 5 },
      },
    })
    if (!field) throw new AppError('Field not found', 404, 'NOT_FOUND')
    res.json({ success: true, data: field })
  } catch (err) {
    next(err)
  }
}

// POST /api/farms/:farmId/fields
export async function createField(req: Request, res: Response, next: NextFunction) {
  try {
    await assertFarmOwnership(req.params.farmId, req.user!.userId)

    // Validate planted/harvest dates
    const { plantedAt, expectedHarvestAt } = req.body
    if (plantedAt && expectedHarvestAt) {
      if (new Date(plantedAt) >= new Date(expectedHarvestAt)) {
        throw new AppError('Harvest date must be after planting date', 422)
      }
    }

    const field = await prisma.field.create({
      data: {
        ...req.body,
        farmId: req.params.farmId,
        plantedAt: plantedAt ? new Date(plantedAt) : null,
        expectedHarvestAt: expectedHarvestAt ? new Date(expectedHarvestAt) : null,
      },
    })
    res.status(201).json({ success: true, data: field, message: 'Field created' })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/farms/:farmId/fields/:id
export async function updateField(req: Request, res: Response, next: NextFunction) {
  try {
    await assertFarmOwnership(req.params.farmId, req.user!.userId)
    const existing = await prisma.field.findFirst({
      where: { id: req.params.id, farmId: req.params.farmId },
    })
    if (!existing) throw new AppError('Field not found', 404, 'NOT_FOUND')

    const { plantedAt, expectedHarvestAt, ...rest } = req.body
    const field = await prisma.field.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(plantedAt !== undefined && { plantedAt: plantedAt ? new Date(plantedAt) : null }),
        ...(expectedHarvestAt !== undefined && {
          expectedHarvestAt: expectedHarvestAt ? new Date(expectedHarvestAt) : null,
        }),
      },
    })
    res.json({ success: true, data: field })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/farms/:farmId/fields/:id
export async function deleteField(req: Request, res: Response, next: NextFunction) {
  try {
    await assertFarmOwnership(req.params.farmId, req.user!.userId)
    const existing = await prisma.field.findFirst({
      where: { id: req.params.id, farmId: req.params.farmId },
    })
    if (!existing) throw new AppError('Field not found', 404, 'NOT_FOUND')

    await prisma.field.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Field deleted' })
  } catch (err) {
    next(err)
  }
}
