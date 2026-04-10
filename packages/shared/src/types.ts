// ─── User ────────────────────────────────────────────────────────────────────

export type Role = 'FARMER' | 'AGENT' | 'ADMIN'

export interface User {
  id: string
  name: string
  phone: string
  email?: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'>
  tokens: AuthTokens
}

// ─── Farm ────────────────────────────────────────────────────────────────────

export type SoilType =
  | 'CLAY'
  | 'SANDY'
  | 'LOAM'
  | 'SILT'
  | 'CLAY_LOAM'
  | 'SANDY_LOAM'
  | 'PEAT'
  | 'CHALK'

export interface Farm {
  id: string
  userId: string
  name: string
  county: string
  subCounty: string
  latitude: number
  longitude: number
  totalAreaAcres: number
  createdAt: Date
  updatedAt: Date
}

// ─── Field ───────────────────────────────────────────────────────────────────

export type FieldStatus = 'ACTIVE' | 'FALLOW' | 'PLANTED' | 'HARVESTED'

export interface Field {
  id: string
  farmId: string
  name: string
  areaAcres: number
  soilType: SoilType
  currentCrop?: string | null
  plantedAt?: Date | null
  expectedHarvestAt?: Date | null
  status: FieldStatus
  createdAt: Date
  updatedAt: Date
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export interface WeatherForecast {
  date: string
  tempMin: number
  tempMax: number
  humidity: number
  rainfall: number
  windSpeed: number
  description: string
  icon: string
}

export interface WeatherAlert {
  id: string
  farmId: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  message: string
  expiresAt: Date
  createdAt: Date
}

// ─── Market Prices ───────────────────────────────────────────────────────────

export type PriceUnit = 'KG' | 'BAG_90KG' | 'BAG_50KG' | 'TON' | 'CRATE' | 'PIECE'

export interface CropPrice {
  id: string
  crop: string
  region: string
  county: string
  priceKes: number
  unit: PriceUnit
  source: string
  recordedAt: Date
}

// ─── Credit ──────────────────────────────────────────────────────────────────

export type CreditRating = 'POOR' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT'

export interface CreditScore {
  id: string
  userId: string
  score: number
  rating: CreditRating
  maxLoanAmountKes: number
  factors: CreditFactor[]
  computedAt: Date
}

export interface CreditFactor {
  factor: string
  score: number
  maxScore: number
  description: string
}

// ─── Loans ───────────────────────────────────────────────────────────────────

export type LoanStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'DEFAULTED'
  | 'CLOSED'

export type LoanPurpose =
  | 'SEEDS'
  | 'FERTILIZER'
  | 'PESTICIDES'
  | 'EQUIPMENT'
  | 'IRRIGATION'
  | 'LABOR'
  | 'OTHER'

export interface LoanApplication {
  id: string
  userId: string
  amountKes: number
  purpose: LoanPurpose
  purposeDetails?: string | null
  termMonths: number
  interestRatePct: number
  status: LoanStatus
  appliedAt: Date
  approvedAt?: Date | null
  disbursedAt?: Date | null
  closedAt?: Date | null
}

export interface RepaymentSchedule {
  id: string
  loanId: string
  dueDate: Date
  principalKes: number
  interestKes: number
  totalKes: number
  paidAt?: Date | null
  paidAmountKes?: number | null
}

// ─── AI Prediction ───────────────────────────────────────────────────────────

export interface YieldPredictionInput {
  crop: string
  soilType: SoilType
  areaAcres: number
  rainfallMm: number
  tempAvgC: number
  fertilizerUsed: boolean
  irrigated: boolean
  season: 'LONG_RAINS' | 'SHORT_RAINS' | 'DRY'
}

export interface YieldPrediction {
  cropName: string
  predictedYieldKg: number
  predictedYieldPerAcre: number
  confidencePct: number
  estimatedRevenueKes: number
  recommendations: string[]
  riskFactors: string[]
}

// ─── API Response wrappers ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  code?: string
  details?: Record<string, string[]>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
