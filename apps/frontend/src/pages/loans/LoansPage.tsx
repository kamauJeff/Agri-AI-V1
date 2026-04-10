import { useState } from 'react'
import { Landmark, ChevronDown, ChevronUp, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { useLoans, useApplyLoan, useCreditScore } from '@/hooks/useApi'
import { formatKes, formatDate, getLoanStatusColor } from '@/lib/utils'

const PURPOSES = ['SEEDS', 'FERTILIZER', 'PESTICIDES', 'EQUIPMENT', 'IRRIGATION', 'LABOR', 'OTHER']

function LoanCard({ loan }: { loan: any }) {
  const [expanded, setExpanded] = useState(false)
  const paid = loan.repaymentSchedules?.filter((s: any) => s.paidAt).length ?? 0
  const total = loan.repaymentSchedules?.length ?? 0

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div
        className="flex items-start justify-between p-5 cursor-pointer hover:bg-muted/30 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 shrink-0">
            <Landmark className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{formatKes(loan.amountKes)}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getLoanStatusColor(loan.status)}`}>
                {loan.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loan.purpose.replace('_', ' ')} · {loan.termMonths} months · {loan.interestRatePct}% p.a.
            </p>
            <p className="text-xs text-muted-foreground">Applied {formatDate(loan.appliedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <div className="text-right text-xs text-muted-foreground">
              <p>{paid}/{total} paid</p>
              <div className="mt-1 h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(paid / total) * 100}%` }} />
              </div>
            </div>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && loan.repaymentSchedules?.length > 0 && (
        <div className="border-t px-5 pb-5 pt-4 animate-fade-in">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Repayment schedule</p>
          <div className="space-y-2">
            {loan.repaymentSchedules.map((s: any, i: number) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  {s.paidAt
                    ? <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
                    : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div>
                    <p className="text-sm font-medium">Instalment {i + 1}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(s.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatKes(s.totalKes)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Principal {formatKes(s.principalKes)} + Interest {formatKes(s.interestKes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ApplyForm({ maxLoan, rating }: { maxLoan: number; rating: string }) {
  const [form, setForm] = useState({
    amountKes: '', purpose: 'SEEDS', purposeDetails: '', termMonths: '12',
  })
  const [error, setError] = useState('')
  const apply = useApplyLoan()

  const rate = { POOR: 18, FAIR: 15, GOOD: 12, VERY_GOOD: 10, EXCELLENT: 8 }[rating] ?? 15
  const amount = Number(form.amountKes) || 0
  const months = Number(form.termMonths) || 12
  const monthlyRate = rate / 100 / 12
  const emi = monthlyRate === 0 ? amount / months
    : (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await apply.mutateAsync({
        amountKes: Number(form.amountKes),
        purpose: form.purpose as any,
        purposeDetails: form.purposeDetails || undefined,
        termMonths: Number(form.termMonths),
      })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Application failed.')
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold mb-4">Apply for a loan</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Loan amount (KES)</label>
            <input
              type="number"
              min="1000"
              max={maxLoan}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={`Max: ${formatKes(maxLoan)}`}
              value={form.amountKes}
              onChange={(e) => setForm({ ...form, amountKes: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Term (months)</label>
            <select
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-card"
              value={form.termMonths}
              onChange={(e) => setForm({ ...form, termMonths: e.target.value })}
            >
              {[3, 6, 9, 12, 18, 24, 36].map((m) => (
                <option key={m} value={m}>{m} months</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Purpose</label>
          <select
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-card"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          >
            {PURPOSES.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Details <span className="text-muted-foreground">(optional)</span></label>
          <textarea
            rows={2}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Describe how you'll use the loan…"
            value={form.purposeDetails}
            onChange={(e) => setForm({ ...form, purposeDetails: e.target.value })}
          />
        </div>

        {amount > 0 && (
          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-4 text-sm space-y-2">
            <p className="font-medium text-brand-800 dark:text-brand-300">Loan preview</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Interest rate</p>
                <p className="font-semibold text-brand-700">{rate}% p.a.</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly payment</p>
                <p className="font-semibold text-brand-700">{formatKes(Math.round(emi))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total repayment</p>
                <p className="font-semibold text-brand-700">{formatKes(Math.round(emi * months))}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={apply.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition"
        >
          {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit application
        </button>
      </form>
    </div>
  )
}

export default function LoansPage() {
  const { data: loans, isLoading } = useLoans()
  const { data: creditScore } = useCreditScore()

  const activeLoans = loans?.filter((l: any) =>
    ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE'].includes(l.status)
  ) ?? []
  const hasActive = activeLoans.length > 0

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Loans</h1>
        <p className="text-muted-foreground text-sm mt-1">Apply for farm credit and track repayments</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Apply form — only if no active loan */}
        {!hasActive && creditScore && (
          <ApplyForm maxLoan={creditScore.maxLoanAmountKes} rating={creditScore.rating} />
        )}

        {hasActive && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-5 text-sm">
            <p className="font-medium text-amber-800">Active loan in progress</p>
            <p className="text-amber-700 mt-1">You cannot apply for a new loan while you have an active application or outstanding loan.</p>
          </div>
        )}

        {!creditScore && (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <p className="font-medium">Credit score required</p>
            <p className="text-sm mt-1">Visit the Credit page to compute your score first.</p>
          </div>
        )}

        {/* Loan list */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Your loans</h2>

          {isLoading && <div className="skeleton h-32 rounded-xl" />}

          {!isLoading && loans?.length === 0 && (
            <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
              <Landmark className="mx-auto h-10 w-10 opacity-30 mb-3" />
              <p>No loans yet. Apply for your first loan.</p>
            </div>
          )}

          {loans?.map((loan: any) => <LoanCard key={loan.id} loan={loan} />)}
        </div>
      </div>
    </div>
  )
}
