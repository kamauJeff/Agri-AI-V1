export function formatKes(amount: number): string {
  return `KES ${new Intl.NumberFormat('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-KE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))
}

export function scoreToPercent(score: number): number {
  return Math.round(((score - 300) / (850 - 300)) * 100)
}

export function getCreditRatingColor(rating: string): string {
  const map: Record<string, string> = {
    POOR: '#dc2626', FAIR: '#d97706', GOOD: '#ca8a04',
    VERY_GOOD: '#16a34a', EXCELLENT: '#15803d',
  }
  return map[rating] ?? '#6b7280'
}

export function getLoanStatusColor(status: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    PENDING:  { bg: '#fef3c7', text: '#92400e' },
    APPROVED: { bg: '#dbeafe', text: '#1e40af' },
    DISBURSED:{ bg: '#dcfce7', text: '#166534' },
    ACTIVE:   { bg: '#dcfce7', text: '#166534' },
    CLOSED:   { bg: '#f3f4f6', text: '#374151' },
    DEFAULTED:{ bg: '#fee2e2', text: '#991b1b' },
  }
  return map[status] ?? { bg: '#f3f4f6', text: '#374151' }
}

export function getFieldStatusColor(status: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    ACTIVE:   { bg: '#dbeafe', text: '#1e40af' },
    FALLOW:   { bg: '#f3f4f6', text: '#374151' },
    PLANTED:  { bg: '#dcfce7', text: '#166534' },
    HARVESTED:{ bg: '#fef3c7', text: '#92400e' },
  }
  return map[status] ?? { bg: '#f3f4f6', text: '#374151' }
}
