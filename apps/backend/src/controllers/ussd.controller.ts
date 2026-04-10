import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'

// USSD menu strings
const MENUS = {
  MAIN: `CON Welcome to AgriAI 🌱
1. Check market prices
2. My farm weather
3. My credit score
4. Loan services
5. Exit`,

  MARKET: `CON Select crop:
1. Maize
2. Beans
3. Tomatoes
4. Potatoes
5. Other`,

  LOAN: `CON Loan services:
1. Check loan status
2. Apply for loan
3. Repayment schedule
4. Back`,
}

function goodbye(msg: string) {
  return `END ${msg}`
}

async function getUserByPhone(phone: string) {
  // Normalize: +254... → 07... or 01...
  const normalized = phone.replace('+254', '0')
  return prisma.user.findFirst({
    where: { phone: { in: [phone, normalized] } },
    select: { id: true, name: true },
  })
}

const CROP_MAP: Record<string, string> = {
  '1': 'Maize', '2': 'Beans', '3': 'Tomatoes', '4': 'Potatoes',
}

// POST /ussd
export async function handleUssd(req: Request, res: Response) {
  const { sessionId, phoneNumber, text } = req.body

  // text is cumulative e.g. "1*2*1" means level-1=1, level-2=2, level-3=1
  const parts = text.split('*').filter(Boolean)
  const level = parts.length
  const last = parts[level - 1]

  res.set('Content-Type', 'text/plain')

  // ─── Level 0: Main menu ─────────────────────────────────────────────────────
  if (level === 0) {
    return res.send(MENUS.MAIN)
  }

  const main = parts[0]

  // ─── Exit ───────────────────────────────────────────────────────────────────
  if (main === '5') {
    return res.send(goodbye('Thank you for using AgriAI. Happy farming! 🌱'))
  }

  // ─── 1. Market prices ────────────────────────────────────────────────────────
  if (main === '1') {
    if (level === 1) return res.send(MENUS.MARKET)

    const crop = CROP_MAP[parts[1]] ?? null

    if (!crop) {
      return res.send(goodbye('Invalid selection. Please try again.'))
    }

    try {
      const price = await prisma.cropPrice.findFirst({
        where: { crop: { equals: crop, mode: 'insensitive' } },
        orderBy: { recordedAt: 'desc' },
      })

      if (!price) {
        return res.send(goodbye(`No price data available for ${crop}. Check back later.`))
      }

      return res.send(
        goodbye(
          `${price.crop} - ${price.county}\nKES ${price.priceKes.toLocaleString()} per ${price.unit}\nUpdated: ${price.recordedAt.toLocaleDateString()}`,
        ),
      )
    } catch {
      return res.send(goodbye('Service unavailable. Try again later.'))
    }
  }

  // ─── 2. Weather ──────────────────────────────────────────────────────────────
  if (main === '2') {
    try {
      const user = await getUserByPhone(phoneNumber)
      if (!user) return res.send(goodbye('Register on AgriAI app to access this service.'))

      const farm = await prisma.farm.findFirst({
        where: { userId: user.id },
        include: {
          weatherAlerts: {
            where: { expiresAt: { gt: new Date() } },
            orderBy: { severity: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!farm) return res.send(goodbye('No farm found. Add a farm in the AgriAI app.'))

      const alertMsg = farm.weatherAlerts[0]
        ? `\n⚠ ALERT: ${farm.weatherAlerts[0].message.slice(0, 80)}`
        : '\n✓ No active weather alerts.'

      return res.send(
        goodbye(`${farm.name} - ${farm.county}\nLat: ${farm.latitude.toFixed(2)}, Lon: ${farm.longitude.toFixed(2)}${alertMsg}\n\nFor 7-day forecast, use the AgriAI app.`),
      )
    } catch {
      return res.send(goodbye('Service unavailable. Try again later.'))
    }
  }

  // ─── 3. Credit score ─────────────────────────────────────────────────────────
  if (main === '3') {
    try {
      const user = await getUserByPhone(phoneNumber)
      if (!user) return res.send(goodbye('Register on AgriAI app to access credit services.'))

      const score = await prisma.creditScore.findFirst({
        where: { userId: user.id },
        orderBy: { computedAt: 'desc' },
      })

      if (!score) {
        return res.send(
          goodbye(
            `Hi ${user.name}! Your credit score has not been computed yet.\n\nLog in to the AgriAI app and complete your farm profile to get your score.`,
          ),
        )
      }

      return res.send(
        goodbye(
          `Hi ${user.name}!\n\nCredit Score: ${score.score}/850\nRating: ${score.rating}\nMax Loan: KES ${score.maxLoanAmountKes.toLocaleString()}\n\nFor details, use the AgriAI app.`,
        ),
      )
    } catch {
      return res.send(goodbye('Service unavailable. Try again later.'))
    }
  }

  // ─── 4. Loan services ────────────────────────────────────────────────────────
  if (main === '4') {
    if (level === 1) return res.send(MENUS.LOAN)
    if (parts[1] === '4') return res.send(MENUS.MAIN.replace('CON ', 'CON '))

    try {
      const user = await getUserByPhone(phoneNumber)
      if (!user) return res.send(goodbye('Register on AgriAI app to access loan services.'))

      // 4.1 Loan status
      if (parts[1] === '1') {
        const loan = await prisma.loanApplication.findFirst({
          where: {
            userId: user.id,
            status: { in: ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE'] },
          },
          include: {
            repaymentSchedules: { where: { paidAt: null }, orderBy: { dueDate: 'asc' }, take: 1 },
          },
          orderBy: { appliedAt: 'desc' },
        })

        if (!loan) return res.send(goodbye('No active loans found.\n\nApply via the AgriAI app or select option 2.'))

        const nextPayment = loan.repaymentSchedules[0]
        const msg = [
          `Loan: KES ${loan.amountKes.toLocaleString()}`,
          `Status: ${loan.status}`,
          loan.disbursedAt ? `Disbursed: ${loan.disbursedAt.toLocaleDateString()}` : null,
          nextPayment
            ? `Next payment: KES ${nextPayment.totalKes.toLocaleString()} on ${nextPayment.dueDate.toLocaleDateString()}`
            : null,
        ]
          .filter(Boolean)
          .join('\n')

        return res.send(goodbye(msg))
      }

      // 4.2 Apply — redirect to app
      if (parts[1] === '2') {
        return res.send(
          goodbye('To apply for a loan, open the AgriAI app > Credit > Apply for Loan.\n\nYour pre-approved limit is based on your credit score.'),
        )
      }

      // 4.3 Repayment schedule
      if (parts[1] === '3') {
        const schedules = await prisma.repaymentSchedule.findMany({
          where: {
            loan: { userId: user.id },
            paidAt: null,
          },
          orderBy: { dueDate: 'asc' },
          take: 3,
        })

        if (schedules.length === 0) return res.send(goodbye('No outstanding repayments.'))

        const lines = schedules.map(
          (s, i) => `${i + 1}. KES ${s.totalKes.toLocaleString()} due ${s.dueDate.toLocaleDateString()}`,
        )

        return res.send(goodbye(`Upcoming repayments:\n${lines.join('\n')}`))
      }
    } catch {
      return res.send(goodbye('Service unavailable. Try again later.'))
    }
  }

  return res.send(goodbye('Invalid option. Please try again.'))
}
