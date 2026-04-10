import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useMarketPrices, useCrops, useCounties, usePriceTrend } from '@/hooks/useApi'
import { formatKes, formatDate } from '@/lib/utils'

function TrendChart({ crop, county }: { crop: string; county?: string }) {
  const { data, isLoading } = usePriceTrend(crop, county)

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />
  if (!data || data.length < 2) return (
    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground rounded-xl bg-muted/30">
      Not enough data for trend
    </div>
  )

  const chartData = data.map((p: any) => ({
    date: formatDate(p.recordedAt),
    price: p.priceKes,
  }))

  const first = data[0]?.priceKes
  const last = data[data.length - 1]?.priceKes
  const change = first ? ((last - first) / first) * 100 : 0
  const TrendIcon = change > 1 ? TrendingUp : change < -1 ? TrendingDown : Minus
  const trendColor = change > 1 ? 'text-brand-600' : change < -1 ? 'text-red-500' : 'text-muted-foreground'

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{crop} — 30-day price trend</h3>
          <p className="text-sm text-muted-foreground">{county ?? 'All counties'}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
          <Tooltip formatter={(v: any) => [`KES ${v}`, 'Price']} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function MarketPage() {
  const [search, setSearch] = useState('')
  const [county, setCounty] = useState('')
  const [crop, setCrop] = useState('')
  const [page, setPage] = useState(1)
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null)

  const { data, isLoading } = useMarketPrices({
    crop: search || undefined,
    county: county || undefined,
    page,
    pageSize: 15,
  })
  const { data: crops } = useCrops()
  const { data: counties } = useCounties()

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Market Prices</h1>
        <p className="text-muted-foreground text-sm mt-1">Live crop prices across Kenya counties</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:bg-card"
            placeholder="Search crop…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:bg-card"
          value={county}
          onChange={(e) => { setCounty(e.target.value); setPage(1) }}
        >
          <option value="">All counties</option>
          {counties?.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Price trend chart (shown when crop selected) */}
      {selectedCrop && (
        <TrendChart crop={selectedCrop} county={county || undefined} />
      )}

      {/* Prices table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Crop</th>
                <th className="text-left px-4 py-3 font-medium">County</th>
                <th className="text-left px-4 py-3 font-medium">Region</th>
                <th className="text-right px-4 py-3 font-medium">Price (KES)</th>
                <th className="text-left px-4 py-3 font-medium">Unit</th>
                <th className="text-left px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                  ))}
                </tr>
              ))}
              {data?.items?.map((p: any) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.crop}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.county}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.region}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-700">{formatKes(p.priceKes)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.unit.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(p.recordedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedCrop(selectedCrop === p.crop ? null : p.crop)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      {selectedCrop === p.crop ? 'Hide' : 'Trend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {data.total} prices · Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 transition"
              >Previous</button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 transition"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
