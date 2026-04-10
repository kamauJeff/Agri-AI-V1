import { prisma } from '../utils/prisma'
import { CREDIT_SCORE_WEIGHTS, CREDIT_RATING_RANGES, LOAN_INTEREST_RATES } from '@agriai/shared'
import type { CreditFactor, CreditRating } from '@agriai/shared'

export async function computeCreditScore(userId: string): Promise<{
  score: number
  rating: CreditRating
  maxLoanAmountKes: number
  factors: CreditFactor[]
}> {
  const [user, farms, loans] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true },
    }),
    prisma.farm.findMany({
      where: { userId },
      include: { fields: true },
    }),
    prisma.loanApplication.findMany({
      where: { userId },
      include: { repaymentSchedules: true },
      orderBy: { appliedAt: 'desc' },
    }),
  ])

  if (!user) throw new Error('User not found')

  const factors: CreditFactor[] = []
  let totalScore = 300 // base score

  // ─── 1. Farm size score (0–150) ─────────────────────────────────────────────
  const totalAcres = farms.reduce((s, f) => s + f.totalAreaAcres, 0)
  const farmScore = Math.min(
    CREDIT_SCORE_WEIGHTS.farmSize.max,
    totalAcres <= 0 ? 0
    : totalAcres <= 1 ? 30
    : totalAcres <= 5 ? 75
    : totalAcres <= 20 ? 110
    : totalAcres <= 50 ? 135
    : CREDIT_SCORE_WEIGHTS.farmSize.max,
  )
  factors.push({
    factor: 'Farm size',
    score: farmScore,
    maxScore: CREDIT_SCORE_WEIGHTS.farmSize.max,
    description: `${totalAcres.toFixed(1)} acres across ${farms.length} farm(s)`,
  })
  totalScore += farmScore

  // ─── 2. Platform activity (0–150) ──────────────────────────────────────────
  const totalFields = farms.reduce((s, f) => s + f.fields.length, 0)
  const fieldsWithCrops = farms.reduce(
    (s, f) => s + f.fields.filter((fi) => fi.currentCrop).length,
    0,
  )
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  )
  const activityScore = Math.min(
    CREDIT_SCORE_WEIGHTS.activityLevel.max,
    (farms.length > 0 ? 30 : 0) +
    (totalFields > 0 ? 30 : 0) +
    (fieldsWithCrops > 0 ? 30 : 0) +
    Math.min(40, Math.floor(accountAgeDays / 30) * 4) + // 4pts per month, max 40
    (loans.length > 0 ? 20 : 0), // has used platform for loans
  )
  factors.push({
    factor: 'Platform activity',
    score: activityScore,
    maxScore: CREDIT_SCORE_WEIGHTS.activityLevel.max,
    description: `${farms.length} farm(s), ${totalFields} field(s), ${accountAgeDays} days active`,
  })
  totalScore += activityScore

  // ─── 3. Loan repayment history (0–200) ─────────────────────────────────────
  let loanScore = 0
  const closedLoans = loans.filter((l) => ['CLOSED', 'ACTIVE'].includes(l.status))

  if (closedLoans.length === 0) {
    loanScore = 60 // no history — neutral
  } else {
    let onTime = 0
    let late = 0
    let missed = 0

    for (const loan of closedLoans) {
      for (const schedule of loan.repaymentSchedules) {
        if (schedule.paidAt) {
          if (schedule.paidAt <= schedule.dueDate) onTime++
          else late++
        } else if (schedule.dueDate < new Date()) {
          missed++
        }
      }
    }

    const total = onTime + late + missed
    if (total > 0) {
      const onTimePct = onTime / total
      loanScore = Math.round(onTimePct * CREDIT_SCORE_WEIGHTS.loanHistory.max)
      if (missed > 0) loanScore = Math.max(0, loanScore - missed * 20)
    }

    // Bonus for defaults (negative)
    const defaulted = loans.filter((l) => l.status === 'DEFAULTED').length
    loanScore = Math.max(0, loanScore - defaulted * 50)
  }

  loanScore = Math.min(CREDIT_SCORE_WEIGHTS.loanHistory.max, loanScore)
  factors.push({
    factor: 'Loan repayment history',
    score: loanScore,
    maxScore: CREDIT_SCORE_WEIGHTS.loanHistory.max,
    description:
      closedLoans.length === 0
        ? 'No loan history yet'
        : `${closedLoans.length} loan(s) on record`,
  })
  totalScore += loanScore

  // ─── 4. Crop diversity (0–100) ──────────────────────────────────────────────
  const uniqueCrops = new Set(
    farms.flatMap((f) => f.fields.map((fi) => fi.currentCrop).filter(Boolean)),
  ).size
  const diversityScore = Math.min(
    CREDIT_SCORE_WEIGHTS.cropDiversity.max,
    uniqueCrops === 0 ? 0
    : uniqueCrops === 1 ? 30
    : uniqueCrops === 2 ? 55
    : uniqueCrops === 3 ? 75
    : uniqueCrops >= 4 ? CREDIT_SCORE_WEIGHTS.cropDiversity.max
    : 0,
  )
  factors.push({
    factor: 'Crop diversity',
    score: diversityScore,
    maxScore: CREDIT_SCORE_WEIGHTS.cropDiversity.max,
    description: `${uniqueCrops} unique crop(s) — reduces income concentration risk`,
  })
  totalScore += diversityScore

  // ─── 5. Weather risk (0–100) — based on location ───────────────────────────
  // Simplified: farms in arid/semi-arid counties score lower
  const ARID_COUNTIES = ['Turkana', 'Marsabit', 'Mandera', 'Wajir', 'Garissa', 'Isiolo', 'Samburu']
  const farmCounties = farms.map((f) => f.county)
  const aridFarms = farmCounties.filter((c) => ARID_COUNTIES.includes(c)).length
  const weatherScore = farms.length === 0
    ? 50
    : Math.round(CREDIT_SCORE_WEIGHTS.weatherRisk.max * (1 - (aridFarms / farms.length) * 0.6))

  factors.push({
    factor: 'Weather risk',
    score: weatherScore,
    maxScore: CREDIT_SCORE_WEIGHTS.weatherRisk.max,
    description:
      aridFarms > 0
        ? `${aridFarms} farm(s) in high-risk weather zone`
        : 'Farms in moderate/low weather risk zones',
  })
  totalScore += weatherScore

  // ─── 6. Market access (0–100) ───────────────────────────────────────────────
  // Proxy: farms in high-market-access counties score higher
  const HIGH_MARKET_COUNTIES = ['Nairobi', 'Kiambu', 'Nakuru', 'Mombasa', 'Kisumu', 'Eldoret']
  const highMarketFarms = farmCounties.filter((c) => HIGH_MARKET_COUNTIES.includes(c)).length
  const marketScore = farms.length === 0
    ? 40
    : Math.min(
        CREDIT_SCORE_WEIGHTS.marketAccess.max,
        40 + Math.round((highMarketFarms / farms.length) * 60),
      )

  factors.push({
    factor: 'Market access',
    score: marketScore,
    maxScore: CREDIT_SCORE_WEIGHTS.marketAccess.max,
    description:
      highMarketFarms > 0
        ? `${highMarketFarms} farm(s) near major markets`
        : 'Limited proximity to major markets',
  })
  totalScore += marketScore

  // ─── Clamp to 300–850 ───────────────────────────────────────────────────────
  const score = Math.min(850, Math.max(300, Math.round(totalScore)))

  // ─── Determine rating & max loan ────────────────────────────────────────────
  const ratingEntry = CREDIT_RATING_RANGES.find((r) => score >= r.min && score <= r.max)!
  const rating = ratingEntry.rating as CreditRating
  const maxLoanAmountKes = ratingEntry.maxLoanKes

  return { score, rating, maxLoanAmountKes, factors }
}

export function getInterestRate(rating: CreditRating): number {
  return LOAN_INTEREST_RATES[rating] ?? 15
}
