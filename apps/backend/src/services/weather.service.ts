import axios from 'axios'
import { prisma } from '../utils/prisma'
import { WeatherForecast } from '@agriai/shared'

const OWM_BASE = 'https://api.openweathermap.org/data/2.5'
const API_KEY = () => process.env.OPENWEATHER_API_KEY!

interface OWMForecastItem {
  dt: number
  main: { temp_min: number; temp_max: number; humidity: number }
  weather: { description: string; icon: string }[]
  wind: { speed: number }
  rain?: { '3h': number }
}

export async function fetchForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
  const { data } = await axios.get(`${OWM_BASE}/forecast`, {
    params: { lat, lon, appid: API_KEY(), units: 'metric', cnt: 40 },
  })

  // Group 3-hour slots by day and aggregate
  const byDay = new Map<string, OWMForecastItem[]>()

  for (const item of data.list as OWMForecastItem[]) {
    const day = new Date(item.dt * 1000).toISOString().slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(item)
  }

  const forecasts: WeatherForecast[] = []

  for (const [date, items] of byDay) {
    const temps = items.map((i) => i.main.temp_min)
    const tempsMax = items.map((i) => i.main.temp_max)
    const rainfall = items.reduce((s, i) => s + (i.rain?.['3h'] ?? 0), 0)
    const humidity = Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length)
    const windSpeed = Math.round(items.reduce((s, i) => s + i.wind.speed, 0) / items.length)
    const mid = items[Math.floor(items.length / 2)]

    forecasts.push({
      date,
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...tempsMax)),
      humidity,
      rainfall: Math.round(rainfall * 10) / 10,
      windSpeed,
      description: mid.weather[0].description,
      icon: mid.weather[0].icon,
    })

    if (forecasts.length === 7) break
  }

  return forecasts
}

export async function fetchCurrentWeather(lat: number, lon: number) {
  const { data } = await axios.get(`${OWM_BASE}/weather`, {
    params: { lat, lon, appid: API_KEY(), units: 'metric' },
  })
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed),
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    visibility: data.visibility,
  }
}

// Detect extreme weather and create DB alerts
export async function detectAndSaveAlerts(farmId: string, forecasts: WeatherForecast[]) {
  const alerts: {
    farmId: string
    type: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    message: string
    expiresAt: Date
  }[] = []

  for (const f of forecasts) {
    const expiresAt = new Date(f.date + 'T23:59:59Z')

    if (f.rainfall > 50) {
      alerts.push({
        farmId,
        type: 'HEAVY_RAIN',
        severity: f.rainfall > 100 ? 'HIGH' : 'MEDIUM',
        message: `Heavy rainfall expected on ${f.date}: ${f.rainfall}mm. Delay planting and check drainage.`,
        expiresAt,
      })
    }

    if (f.tempMax > 38) {
      alerts.push({
        farmId,
        type: 'EXTREME_HEAT',
        severity: 'HIGH',
        message: `Extreme heat on ${f.date}: ${f.tempMax}°C. Irrigate early morning and evening.`,
        expiresAt,
      })
    }

    if (f.windSpeed > 15) {
      alerts.push({
        farmId,
        type: 'HIGH_WINDS',
        severity: f.windSpeed > 25 ? 'HIGH' : 'MEDIUM',
        message: `Strong winds on ${f.date}: ${f.windSpeed}m/s. Stake tall crops and secure structures.`,
        expiresAt,
      })
    }

    if (f.humidity < 30 && f.rainfall === 0) {
      alerts.push({
        farmId,
        type: 'DRY_SPELL',
        severity: 'MEDIUM',
        message: `Low humidity (${f.humidity}%) and no rain on ${f.date}. Consider irrigation.`,
        expiresAt,
      })
    }
  }

  if (alerts.length > 0) {
    await prisma.weatherAlert.createMany({ data: alerts, skipDuplicates: false })
  }

  return alerts
}
