import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKes(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date))
}

export function formatRelative(date: string | Date): string {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return formatDate(date)
}

export function getCreditRatingColor(rating: string): string {
  const map: Record<string, string> = {
    POOR: 'text-red-600',
    FAIR: 'text-amber-600',
    GOOD: 'text-yellow-600',
    VERY_GOOD: 'text-brand-600',
    EXCELLENT: 'text-brand-700',
  }
  return map[rating] ?? 'text-muted-foreground'
}

export function getCreditRatingBg(rating: string): string {
  const map: Record<string, string> = {
    POOR: 'bg-red-100 text-red-800',
    FAIR: 'bg-amber-100 text-amber-800',
    GOOD: 'bg-yellow-100 text-yellow-800',
    VERY_GOOD: 'bg-brand-100 text-brand-800',
    EXCELLENT: 'bg-brand-200 text-brand-900',
  }
  return map[rating] ?? 'bg-muted text-muted-foreground'
}

export function getLoanStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    DISBURSED: 'bg-brand-100 text-brand-800',
    ACTIVE: 'bg-brand-100 text-brand-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    DEFAULTED: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export function getFieldStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    FALLOW: 'bg-gray-100 text-gray-700',
    PLANTED: 'bg-brand-100 text-brand-800',
    HARVESTED: 'bg-amber-100 text-amber-800',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export function getAlertSeverityClass(severity: string): string {
  const map: Record<string, string> = {
    HIGH: 'alert-high',
    MEDIUM: 'alert-medium',
    LOW: 'alert-low',
  }
  return map[severity] ?? 'alert-low'
}

export function scoreToPercent(score: number): number {
  return Math.round(((score - 300) / (850 - 300)) * 100)
}
