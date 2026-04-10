import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'

// GET /api/market/prices
export async function getPrices(req: Request, res: Response, next: NextFunction) {
  try {
    const { crop, county, region, page = 1, pageSize = 20 } = req.query as any

    const where: any = {}
    if (crop) where.crop = { contains: crop, mode: 'insensitive' }
    if (county) where.county = { contains: county, mode: 'insensitive' }
    if (region) where.region = { contains: region, mode: 'insensitive' }

    const skip = (Number(page) - 1) * Number(pageSize)

    const [items, total] = await Promise.all([
      prisma.cropPrice.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.cropPrice.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/market/prices/latest  — one latest price per crop per county
export async function getLatestPrices(req: Request, res: Response, next: NextFunction) {
  try {
    const { county } = req.query

    // Get distinct crop+county combos with latest price
    const latest = await prisma.$queryRaw<
      { crop: string; county: string; region: string; price_kes: number; unit: string; recorded_at: Date }[]
    >`
      SELECT DISTINCT ON (crop, county)
        crop, county, region,
        price_kes AS "priceKes",
        unit,
        recorded_at AS "recordedAt"
      FROM "CropPrice"
      ${county ? prisma.$queryRaw`WHERE county ILIKE ${`%${county}%`}` : prisma.$queryRaw``}
      ORDER BY crop, county, recorded_at DESC
    `

    res.json({ success: true, data: latest })
  } catch (err) {
    next(err)
  }
}

// GET /api/market/crops  — distinct crop list
export async function getCrops(req: Request, res: Response, next: NextFunction) {
  try {
    const crops = await prisma.cropPrice.findMany({
      select: { crop: true },
      distinct: ['crop'],
      orderBy: { crop: 'asc' },
    })
    res.json({ success: true, data: crops.map((c) => c.crop) })
  } catch (err) {
    next(err)
  }
}

// GET /api/market/counties  — distinct county list
export async function getCounties(req: Request, res: Response, next: NextFunction) {
  try {
    const counties = await prisma.cropPrice.findMany({
      select: { county: true },
      distinct: ['county'],
      orderBy: { county: 'asc' },
    })
    res.json({ success: true, data: counties.map((c) => c.county) })
  } catch (err) {
    next(err)
  }
}

// GET /api/market/prices/:crop/trend  — 30-day price trend for a crop
export async function getPriceTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const { crop } = req.params
    const { county } = req.query

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const prices = await prisma.cropPrice.findMany({
      where: {
        crop: { equals: crop, mode: 'insensitive' },
        ...(county ? { county: { contains: county as string, mode: 'insensitive' } } : {}),
        recordedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { recordedAt: 'asc' },
      select: { priceKes: true, county: true, unit: true, recordedAt: true },
    })

    if (prices.length === 0) throw new AppError('No price data found for this crop', 404)

    res.json({ success: true, data: prices })
  } catch (err) {
    next(err)
  }
}

// POST /api/market/prices  (admin only)
export async function createPrice(req: Request, res: Response, next: NextFunction) {
  try {
    const price = await prisma.cropPrice.create({ data: req.body })
    res.status(201).json({ success: true, data: price })
  } catch (err) {
    next(err)
  }
}
