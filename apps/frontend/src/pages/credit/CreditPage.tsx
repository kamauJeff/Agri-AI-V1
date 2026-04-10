import { RefreshCw } from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { useCreditScore, useCreditHistory, useRefreshCreditScore } from '@/hooks/useApi'
import { formatKes, getCreditRatingBg, scoreToPercent, formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'

function ScoreRing({ score }: { score: number }) {
  const pct = scoreToPercent(score)
  const color = score < 500 ? '#ef4444' : score < 600 ? '#f59e0b' : score < 700 ? '#eab308' : '#16a34a'

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={200} height={200}>
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="70%" outerRadius="90%"
          startAngle={210} endAngle={-30}
          data={[{ value: pct, fill: color }]}
        >
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'hsl(var(--muted))' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-semibold">{score}</span>
        <span className="text-xs text-muted-foreground">out of 850</span>
      </div>
    </div>
  )
}

function FactorBar({ factor, score, maxScore, description }: any) {
  const pct = (score / maxScore) * 100
  const color = pct >= 70 ? 'bg-brand-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{factor}</span>
        <span className="text-muted-foreground">{score}/{maxScore}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

export default function CreditPage() {
  const { data: score, isLoading } = useCreditScore()
  const { data: history } = useCreditHistory()
  const refresh = useRefreshCreditScore()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="skeleton h-72 rounded-xl" />
          <div className="lg:col-span-2 skeleton h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!score) return null

  const factors = score.factors as any[]
  const historyChartData = history?.map((h: any) => ({
    date: formatDate(h.computedAt),
    score: h.score,
  })).reverse()

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Credit Score</h1>
          <p className="text-muted-foreground text-sm mt-1">Your farm-based creditworthiness score</p>
        </div>
        <button
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
          Refresh score
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score ring card */}
        <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
          <ScoreRing score={score.score} />
          <div className="mt-2 space-y-3">
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${getCreditRatingBg(score.rating)}`}>
              {score.rating.replace('_', ' ')}
            </span>
            <div className="rounded-xl bg-muted/50 p-4 text-left space-y-1">
              <p className="text-xs text-muted-foreground">Maximum loan amount</p>
              <p className="text-2xl font-display font-semibold text-brand-700">{formatKes(score.maxLoanAmountKes)}</p>
            </div>
            <Link
              to="/loans"
              className="block w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
            >
              Apply for a loan →
            </Link>
          </div>
        </div>

        {/* Factors breakdown */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <h2 className="font-display text-lg font-semibold">Score breakdown</h2>
          <div className="space-y-5 divide-y">
            {factors.map((f: any, i: number) => (
              <div key={f.factor} className={i > 0 ? 'pt-4' : ''}>
                <FactorBar {...f} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score history chart */}
      {historyChartData && historyChartData.length > 1 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-4">Score history</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[300, 850]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [v, 'Credit Score']} />
              <Line type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score range guide */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold mb-4">Score ranges</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { range: '300–499', label: 'Poor', cls: 'bg-red-100 text-red-800', maxLoan: '10K' },
            { range: '500–599', label: 'Fair', cls: 'bg-amber-100 text-amber-800', maxLoan: '50K' },
            { range: '600–699', label: 'Good', cls: 'bg-yellow-100 text-yellow-800', maxLoan: '150K' },
            { range: '700–749', label: 'Very Good', cls: 'bg-brand-100 text-brand-800', maxLoan: '500K' },
            { range: '750–850', label: 'Excellent', cls: 'bg-brand-200 text-brand-900', maxLoan: '2M' },
          ].map((r) => (
            <div key={r.range} className={`rounded-xl p-4 text-center ${r.cls} ${score.score >= parseInt(r.range) && score.score <= parseInt(r.range.split('–')[1]) ? 'ring-2 ring-current ring-offset-1' : ''}`}>
              <p className="font-semibold text-sm">{r.label}</p>
              <p className="text-xs mt-0.5 opacity-80">{r.range}</p>
              <p className="text-xs mt-1 font-medium">Max: KES {r.maxLoan}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
