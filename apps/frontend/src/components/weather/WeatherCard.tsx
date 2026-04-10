import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, Thermometer } from 'lucide-react'
import { useWeatherForecast, useWeatherAlerts } from '@/hooks/useApi'
import { getAlertSeverityClass } from '@/lib/utils'

function WeatherIcon({ icon, size = 5 }: { icon: string; size?: number }) {
  const cls = `h-${size} w-${size}`
  if (icon.includes('01')) return <Sun className={cls + ' text-amber-500'} />
  if (icon.includes('09') || icon.includes('10')) return <CloudRain className={cls + ' text-blue-500'} />
  if (icon.includes('11')) return <CloudRain className={cls + ' text-purple-500'} />
  return <Cloud className={cls + ' text-gray-400'} />
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeatherCard({ farmId }: { farmId: string }) {
  const { data, isLoading, error } = useWeatherForecast(farmId)
  const { data: alerts } = useWeatherAlerts(farmId)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="skeleton h-20 rounded-lg" />
        <div className="skeleton h-16 rounded-lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground text-center">
        Weather unavailable — check your API key or farm location.
      </div>
    )
  }

  const { current, forecast } = data

  return (
    <div className="space-y-3">
      {/* Current weather */}
      <div className="rounded-lg bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-semibold">{current.temp}°C</p>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">{current.description}</p>
          </div>
          <WeatherIcon icon={current.icon} size={10} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{current.humidity}%</span>
          <span className="flex items-center gap-1"><Wind className="h-3 w-3" />{current.windSpeed} m/s</span>
          <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" />Feels {current.feelsLike}°C</span>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="grid grid-cols-7 gap-1">
        {forecast?.slice(0, 7).map((day: any) => {
          const d = new Date(day.date)
          return (
            <div key={day.date} className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 py-2 px-1 text-center">
              <p className="text-[10px] text-muted-foreground">{DAY_LABELS[d.getDay()]}</p>
              <WeatherIcon icon={day.icon} size={4} />
              <p className="text-xs font-medium">{day.tempMax}°</p>
              <p className="text-[10px] text-muted-foreground">{day.tempMin}°</p>
              {day.rainfall > 0 && (
                <p className="text-[10px] text-blue-500">{day.rainfall}mm</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Active alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`flex gap-2 rounded-lg border px-3 py-2.5 text-xs ${getAlertSeverityClass(alert.severity)}`}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
