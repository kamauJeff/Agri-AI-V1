import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'
import { fetchForecast, fetchCurrentWeather, detectAndSaveAlerts } from '../services/weather.service'

// GET /api/weather/:farmId/forecast
export async function getForecast(req: Request, res: Response, next: NextFunction) {
  try {
    const farm = await prisma.farm.findFirst({
      where: { id: req.params.farmId, userId: req.user!.userId },
    })
    if (!farm) throw new AppError('Farm not found', 404, 'NOT_FOUND')

    const [forecast, current] = await Promise.all([
      fetchForecast(farm.latitude, farm.longitude),
      fetchCurrentWeather(farm.latitude, farm.longitude),
    ])

    // Run alert detection in the background
    detectAndSaveAlerts(farm.id, forecast).catch(console.error)

    res.json({ success: true, data: { current, forecast } })
  } catch (err) {
    next(err)
  }
}

// GET /api/weather/:farmId/alerts
export async function getAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const farm = await prisma.farm.findFirst({
      where: { id: req.params.farmId, userId: req.user!.userId },
    })
    if (!farm) throw new AppError('Farm not found', 404, 'NOT_FOUND')

    const alerts = await prisma.weatherAlert.findMany({
      where: { farmId: farm.id, expiresAt: { gt: new Date() } },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    })

    res.json({ success: true, data: alerts })
  } catch (err) {
    next(err)
  }
}
