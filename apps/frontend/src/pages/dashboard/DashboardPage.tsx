import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Sprout, TrendingUp, CreditCard,
  CloudRain, Plus, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import { useFarms, useFarmsSummary, useWeatherForecast, useWeatherAlerts, useLatestPrices, useCreditScore } from '@/hooks/useApi'
import { useAuthStore } from '@/store/authStore'
import { formatKes, formatNumber, getFieldStatusColor, getAlertSeverityClass, getCreditRatingBg } from '@/lib/utils'
import AddFarmModal from '@/components/farm/AddFarmModal'
import WeatherCard from '@/components/weather/WeatherCard'

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }: any) {
  return (
    <div className="stat-card flex items-start gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${color}-100 dark:bg-${color}-900/30 shrink-0`}>
        <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function FarmCard({ farm }: { farm: any }) {
  const [expanded, setExpanded] = useState(false)
  const { data: alerts } = useWeatherAlerts(farm.id)

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Farm header */}
      <div
        className="flex items-start justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30 shrink-0 mt-0.5">
            <MapPin className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold">{farm.name}</h3>
            <p className="text-sm text-muted-foreground">{farm.county}, {farm.subCounty}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatNumber(farm.totalAreaAcres, 1)} acres</span>
              <span>·</span>
              <span>{farm._count?.fields ?? farm.fields?.length ?? 0} fields</span>
              {alerts && alerts.length > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    {alerts.length} alert{alerts.length > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />}
      </div>

      {/* Expanded: fields + weather */}
      {expanded && (
        <div className="border-t px-5 pb-5 pt-4 space-y-4 animate-fade-in">
          {/* Fields */}
          {farm.fields?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Fields</p>
              <div className="space-y-2">
                {farm.fields.map((field: any) => (
                  <div key={field.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{field.name}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(field.areaAcres, 1)} ac · {field.soilType.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      {field.currentCrop && <p className="text-xs font-medium text-brand-700">{field.currentCrop}</p>}
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5 ${getFieldStatusColor(field.status)}`}>
                        {field.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather */}
          <WeatherCard farmId={farm.id} />
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [showAddFarm, setShowAddFarm] = useState(false)
  const { data: farms, isLoading: farmsLoading } = useFarms()
  const { data: summary } = useFarmsSummary()
  const { data: creditScore } = useCreditScore()
  const { data: prices } = useLatestPrices()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening on your farms today.</p>
        </div>
        <button
          onClick={() => setShowAddFarm(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add farm
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={MapPin} label="Total farms" value={summary?.totalFarms ?? '—'} sub={`${formatNumber(summary?.totalAreaAcres ?? 0, 1)} acres total`} color="brand" />
        <StatCard icon={Sprout} label="Active fields" value={summary?.activeFields ?? '—'} sub={`${summary?.totalFields ?? 0} fields total`} color="brand" />
        <StatCard
          icon={CreditCard}
          label="Credit score"
          value={creditScore?.score ?? '—'}
          sub={creditScore ? <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getCreditRatingBg(creditScore.rating)}`}>{creditScore.rating.replace('_', ' ')}</span> : 'Not computed'}
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Max loan"
          value={creditScore ? formatKes(creditScore.maxLoanAmountKes) : '—'}
          sub="Based on credit score"
          color="amber"
        />
      </div>

      {/* Farms + Market prices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Farms list — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-lg font-semibold">My Farms</h2>

          {farmsLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
            </div>
          )}

          {!farmsLoading && farms?.length === 0 && (
            <div className="rounded-xl border-2 border-dashed p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">No farms yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Add your first farm to get started</p>
              <button
                onClick={() => setShowAddFarm(true)}
                className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
              >
                Add farm
              </button>
            </div>
          )}

          {farms?.map((farm: any) => <FarmCard key={farm.id} farm={farm} />)}
        </div>

        {/* Market snapshot — 1/3 width */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Market prices</h2>
            <Link to="/market" className="text-xs text-brand-600 hover:text-brand-700 font-medium">View all →</Link>
          </div>
          <div className="rounded-xl border bg-card shadow-sm divide-y">
            {!prices && (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-10 rounded" />)}
              </div>
            )}
            {prices?.slice(0, 8).map((p: any) => (
              <div key={`${p.crop}-${p.county}`} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{p.crop}</p>
                  <p className="text-xs text-muted-foreground">{p.county}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-700">{formatKes(p.priceKes)}</p>
                  <p className="text-[10px] text-muted-foreground">per {p.unit === 'KG' ? 'kg' : p.unit.replace('_', ' ').toLowerCase()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddFarm && <AddFarmModal onClose={() => setShowAddFarm(false)} />}
    </div>
  )
}
