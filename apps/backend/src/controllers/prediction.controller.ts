import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'
import { predictYield } from '../services/prediction.service'
import { getCurrentSeason } from '@agriai/shared'

// POST /api/predict
export async function getPrediction(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body
    const result = predictYield(input)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

// POST /api/predict/field/:fieldId  — predict and save to field
export async function predictAndSave(req: Request, res: Response, next: NextFunction) {
  try {
    const field = await prisma.field.findFirst({
      where: {
        id: req.params.fieldId,
        farm: { userId: req.user!.userId },
      },
      include: { farm: true },
    })
    if (!field) throw new AppError('Field not found', 404)
    if (!field.currentCrop) throw new AppError('Field has no crop set', 422)

    const { rainfallMm, tempAvgC, fertilizerUsed, irrigated } = req.body
    const season = req.body.season ?? getCurrentSeason()

    const input = {
      crop: field.currentCrop,
      soilType: field.soilType,
      areaAcres: field.areaAcres,
      rainfallMm: rainfallMm ?? 500,
      tempAvgC: tempAvgC ?? 22,
      fertilizerUsed: fertilizerUsed ?? false,
      irrigated: irrigated ?? false,
      season,
    }

    const result = predictYield(input)

    const saved = await prisma.yieldPrediction.create({
      data: {
        fieldId: field.id,
        crop: result.cropName,
        season,
        areaAcres: input.areaAcres,
        rainfallMm: input.rainfallMm,
        tempAvgC: input.tempAvgC,
        fertilizerUsed: input.fertilizerUsed,
        irrigated: input.irrigated,
        predictedYieldKg: result.predictedYieldKg,
        predictedYieldPerAcre: result.predictedYieldPerAcre,
        confidencePct: result.confidencePct,
        estimatedRevenueKes: result.estimatedRevenueKes,
        recommendations: result.recommendations,
        riskFactors: result.riskFactors,
      },
    })

    res.status(201).json({ success: true, data: { prediction: result, saved } })
  } catch (err) {
    next(err)
  }
}

// GET /api/predict/field/:fieldId/history
export async function getPredictionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const field = await prisma.field.findFirst({
      where: { id: req.params.fieldId, farm: { userId: req.user!.userId } },
    })
    if (!field) throw new AppError('Field not found', 404)

    const history = await prisma.yieldPrediction.findMany({
      where: { fieldId: field.id },
      orderBy: { predictedAt: 'desc' },
      take: 10,
    })

    res.json({ success: true, data: history })
  } catch (err) {
    next(err)
  }
}
