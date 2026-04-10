import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'
import { computeCreditScore, getInterestRate } from '../services/credit.service'

function generateRepaymentSchedule(
  loanId: string,
  principal: number,
  annualRatePct: number,
  termMonths: number,
  startDate: Date,
) {
  const monthlyRate = annualRatePct / 100 / 12
  const emi =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)

  const schedules = []
  let balance = principal

  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * monthlyRate
    const principalPart = emi - interest
    balance -= principalPart

    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i)

    schedules.push({
      loanId,
      dueDate,
      principalKes: Math.round(principalPart * 100) / 100,
      interestKes: Math.round(interest * 100) / 100,
      totalKes: Math.round(emi * 100) / 100,
    })
  }

  return schedules
}

// POST /api/loans/apply
export async function applyForLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { amountKes, purpose, purposeDetails, termMonths } = req.body

    // Get latest credit score
    const creditScore = await prisma.creditScore.findFirst({
      where: { userId },
      orderBy: { computedAt: 'desc' },
    })

    // Compute fresh if not available
    const score = creditScore ?? (await (async () => {
      const result = await computeCreditScore(userId)
      return prisma.creditScore.create({ data: { userId, ...result } })
    })())

    if (amountKes > score.maxLoanAmountKes) {
      throw new AppError(
        `Your credit limit is KES ${score.maxLoanAmountKes.toLocaleString()}. Requested KES ${amountKes.toLocaleString()} exceeds this.`,
        422,
        'EXCEEDS_CREDIT_LIMIT',
      )
    }

    // Check no active pending application
    const pendingLoan = await prisma.loanApplication.findFirst({
      where: { userId, status: { in: ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE'] } },
    })
    if (pendingLoan) {
      throw new AppError('You have an active loan application or outstanding loan.', 422, 'ACTIVE_LOAN_EXISTS')
    }

    const interestRatePct = getInterestRate(score.rating as any)

    const loan = await prisma.loanApplication.create({
      data: {
        userId,
        amountKes,
        purpose,
        purposeDetails,
        termMonths,
        interestRatePct,
        status: 'PENDING',
      },
    })

    res.status(201).json({
      success: true,
      data: {
        loan,
        creditRating: score.rating,
        interestRatePct,
        estimatedMonthlyPaymentKes: Math.round(
          ((amountKes * (interestRatePct / 100 / 12) * Math.pow(1 + interestRatePct / 100 / 12, termMonths)) /
            (Math.pow(1 + interestRatePct / 100 / 12, termMonths) - 1)) *
            100,
        ) / 100,
      },
      message: 'Loan application submitted successfully',
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/loans
export async function getLoans(req: Request, res: Response, next: NextFunction) {
  try {
    const loans = await prisma.loanApplication.findMany({
      where: { userId: req.user!.userId },
      include: {
        repaymentSchedules: { orderBy: { dueDate: 'asc' } },
        _count: { select: { transactions: true } },
      },
      orderBy: { appliedAt: 'desc' },
    })
    res.json({ success: true, data: loans })
  } catch (err) {
    next(err)
  }
}

// GET /api/loans/:id
export async function getLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await prisma.loanApplication.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        repaymentSchedules: { orderBy: { dueDate: 'asc' } },
        transactions: { orderBy: { transactedAt: 'desc' } },
      },
    })
    if (!loan) throw new AppError('Loan not found', 404, 'NOT_FOUND')
    res.json({ success: true, data: loan })
  } catch (err) {
    next(err)
  }
}

// POST /api/loans/:id/approve  (ADMIN)
export async function approveLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await prisma.loanApplication.findUnique({ where: { id: req.params.id } })
    if (!loan) throw new AppError('Loan not found', 404)
    if (loan.status !== 'PENDING') throw new AppError('Loan is not in PENDING status', 422)

    const updated = await prisma.loanApplication.update({
      where: { id: loan.id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    })

    res.json({ success: true, data: updated, message: 'Loan approved' })
  } catch (err) {
    next(err)
  }
}

// POST /api/loans/:id/disburse  (ADMIN)
export async function disburseLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await prisma.loanApplication.findUnique({ where: { id: req.params.id } })
    if (!loan) throw new AppError('Loan not found', 404)
    if (loan.status !== 'APPROVED') throw new AppError('Loan must be APPROVED before disbursement', 422)

    const schedules = generateRepaymentSchedule(
      loan.id,
      loan.amountKes,
      loan.interestRatePct,
      loan.termMonths,
      new Date(),
    )

    await prisma.$transaction([
      prisma.loanApplication.update({
        where: { id: loan.id },
        data: { status: 'DISBURSED', disbursedAt: new Date() },
      }),
      prisma.repaymentSchedule.createMany({ data: schedules }),
      prisma.transaction.create({
        data: {
          loanId: loan.id,
          amountKes: loan.amountKes,
          type: 'DISBURSEMENT',
          reference: req.body?.reference,
          notes: `Disbursed KES ${loan.amountKes.toLocaleString()}`,
        },
      }),
    ])

    const updated = await prisma.loanApplication.findUnique({
      where: { id: loan.id },
      include: { repaymentSchedules: { orderBy: { dueDate: 'asc' } } },
    })

    res.json({ success: true, data: updated, message: 'Loan disbursed and repayment schedule created' })
  } catch (err) {
    next(err)
  }
}

// POST /api/loans/:id/repay  — record a repayment
export async function recordRepayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { amountKes, reference } = req.body
    const loan = await prisma.loanApplication.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { repaymentSchedules: { where: { paidAt: null }, orderBy: { dueDate: 'asc' } } },
    })
    if (!loan) throw new AppError('Loan not found', 404)
    if (!['DISBURSED', 'ACTIVE'].includes(loan.status)) {
      throw new AppError('Loan is not in a repayable state', 422)
    }

    // Mark next due schedule as paid
    const nextDue = loan.repaymentSchedules[0]
    if (!nextDue) throw new AppError('No outstanding repayments found', 422)

    await prisma.$transaction([
      prisma.repaymentSchedule.update({
        where: { id: nextDue.id },
        data: { paidAt: new Date(), paidAmountKes: amountKes },
      }),
      prisma.transaction.create({
        data: { loanId: loan.id, amountKes, type: 'REPAYMENT', reference, notes: `Repayment for schedule ${nextDue.id}` },
      }),
      // If no more unpaid schedules, close the loan
      ...(loan.repaymentSchedules.length === 1
        ? [prisma.loanApplication.update({ where: { id: loan.id }, data: { status: 'CLOSED', closedAt: new Date() } })]
        : [prisma.loanApplication.update({ where: { id: loan.id }, data: { status: 'ACTIVE' } })]),
    ])

    res.json({ success: true, message: 'Repayment recorded successfully' })
  } catch (err) {
    next(err)
  }
}
