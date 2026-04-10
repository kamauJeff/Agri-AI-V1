import { useState } from 'react'
import { Sprout, Loader2, TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import { usePrediction, useFarms } from '@/hooks/useApi'
import { CROPS, getCurrentSeason } from '@agriai/shared'
import { formatKes, formatNumber } from '@/lib/utils'
import type { YieldPrediction } from '@agriai/shared'

const SOIL_TYPES = ['CLAY', 'SANDY', 'LOAM', 'SILT', 'CLAY_LOAM', 'SANDY_LOAM', 'PEAT', 'CHALK']

function ConfidenceMeter({ pct }: { pct: number }) {
  const color = pct >= 75 ? 'bg-brand-500' : pct >= 55 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ResultCard({ result }: { result: YieldPrediction }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-200 text-sm">Predicted yield for</p>
            <h2 className="font-display text-2xl font-semibold">{result.cropName}</h2>
          </div>
          <Sprout className="h-10 w-10 text-brand-300" />
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-4 text-center">
            <p className="text-2xl font-display font-semibold text-brand-700">{formatNumber(result.predictedYieldKg)} kg</p>
            <p className="text-xs text-muted-foreground mt-1">Total yield</p>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
            <p className="text-2xl font-display font-semibold text-amber-700">{formatNumber(result.predictedYieldPerAcre)}</p>
            <p className="text-xs text-muted-foreground mt-1">kg/acre</p>
          </div>
          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-4 text-center">
            <p className="text-2xl font-display font-semibold text-brand-700">{formatKes(result.estimatedRevenueKes)}</p>
            <p className="text-xs text-muted-foreground mt-1">Est. revenue</p>
          </div>
        </div>

        <ConfidenceMeter pct={result.confidencePct} />

        {/* Recommendations */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
            <CheckCircle2 className="h-4 w-4 text-brand-600" />
            Recommendations
          </h3>
          <ul className="space-y-1.5">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-brand-600 shrink-0 mt-0.5">→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Risk factors */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Risk factors
          </h3>
          <ul className="space-y-1.5">
            {result.riskFactors.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function PredictPage() {
  const [form, setForm] = useState({
    crop: 'Maize',
    soilType: 'LOAM',
    areaAcres: '',
    rainfallMm: '',
    tempAvgC: '',
    fertilizerUsed: false,
    irrigated: false,
    season: getCurrentSeason(),
  })
  const [result, setResult] = useState<YieldPrediction | null>(null)
  const [error, setError] = useState('')
  const predict = usePrediction()
  const { data: farms } = useFarms()

  // Quick-fill from a field
  function fillFromField(field: any) {
    setForm((f) => ({
      ...f,
      soilType: field.soilType,
      areaAcres: String(field.areaAcres),
      crop: field.currentCrop ?? f.crop,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await predict.mutateAsync({
        ...form,
        areaAcres: Number(form.areaAcres),
        rainfallMm: Number(form.rainfallMm),
        tempAvgC: Number(form.tempAvgC),
      } as any)
      setResult(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Prediction failed.')
    }
  }

  const allFields = farms?.flatMap((farm: any) =>
    (farm.fields ?? []).map((field: any) => ({ ...field, farmName: farm.name }))
  ) ?? []

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">AI Yield Prediction</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Get data-driven yield estimates and farming recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-4">Prediction inputs</h2>

          {/* Quick-fill from field */}
          {allFields.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-muted-foreground mb-2">Quick-fill from a field:</p>
              <div className="flex flex-wrap gap-2">
                {allFields.map((field: any) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => fillFromField(field)}
                    className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/70 transition"
                  >
                    {field.farmName} — {field.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Crop</label>
                <select
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-card"
                  value={form.crop}
                  onChange={(e) => setForm({ ...form, crop: e.target.value })}
                >
                  {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Soil type</label>
                <select
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-card"
                  value={form.soilType}
                  onChange={(e) => setForm({ ...form, soilType: e.target.value })}
                >
                  {SOIL_TYPES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Area (acres)</label>
                <input
                  type="number" min="0.1" step="0.1" required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. 5"
                  value={form.areaAcres}
                  onChange={(e) => setForm({ ...form, areaAcres: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Season</label>
                <select
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-card"
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value as any })}
                >
                  <option value="LONG_RAINS">Long Rains (Mar–May)</option>
                  <option value="SHORT_RAINS">Short Rains (Oct–Dec)</option>
                  <option value="DRY">Dry Season</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Rainfall (mm)</label>
                <input
                  type="number" min="0" required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. 500"
                  value={form.rainfallMm}
                  onChange={(e) => setForm({ ...form, rainfallMm: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Avg temp (°C)</label>
                <input
                  type="number" min="0" max="50" required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. 22"
                  value={form.tempAvgC}
                  onChange={(e) => setForm({ ...form, tempAvgC: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-brand-500 text-brand-600 focus:ring-brand-500"
                  checked={form.fertilizerUsed}
                  onChange={(e) => setForm({ ...form, fertilizerUsed: e.target.checked })}
                />
                <span className="text-sm">Using fertilizer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-brand-500 text-brand-600 focus:ring-brand-500"
                  checked={form.irrigated}
                  onChange={(e) => setForm({ ...form, irrigated: e.target.checked })}
                />
                <span className="text-sm">Irrigated</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={predict.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition"
            >
              {predict.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Calculating…</>
                : <><Zap className="h-4 w-4" /> Predict yield</>}
            </button>
          </form>
        </div>

        {/* Result */}
        <div>
          {!result && !predict.isPending && (
            <div className="rounded-xl border-2 border-dashed p-12 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <Sprout className="h-14 w-14 opacity-20 mb-4" />
              <p className="font-medium">Fill in the form to get your yield prediction</p>
              <p className="text-sm mt-1 opacity-70">AI-powered estimates based on Kenya-specific data</p>
            </div>
          )}
          {predict.isPending && (
            <div className="rounded-xl border bg-card p-12 flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
              <p className="text-sm text-muted-foreground">Running prediction model…</p>
            </div>
          )}
          {result && <ResultCard result={result} />}
        </div>
      </div>
    </div>
  )
}
