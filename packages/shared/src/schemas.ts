import { z } from 'zod'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^(\+254|0)[17]\d{8}$/, 'Enter a valid Kenyan phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  role: z.enum(['FARMER', 'AGENT', 'ADMIN']).default('FARMER'),
})

export const LoginSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(1, 'Password is required'),
})

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export const ForgotPasswordSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
})

// ─── Farm ────────────────────────────────────────────────────────────────────

export const CreateFarmSchema = z.object({
  name: z.string().min(2, 'Farm name is required'),
  county: z.string().min(2, 'County is required'),
  subCounty: z.string().min(2, 'Sub-county is required'),
  latitude: z.number().min(-4.7).max(4.6),
  longitude: z.number().min(33.9).max(42.0),
  totalAreaAcres: z.number().positive('Area must be positive'),
})

export const UpdateFarmSchema = CreateFarmSchema.partial()

// ─── Field ───────────────────────────────────────────────────────────────────

export const SoilTypeSchema = z.enum([
  'CLAY', 'SANDY', 'LOAM', 'SILT',
  'CLAY_LOAM', 'SANDY_LOAM', 'PEAT', 'CHALK',
])

export const CreateFieldSchema = z.object({
  name: z.string().min(2, 'Field name is required'),
  areaAcres: z.number().positive('Area must be positive'),
  soilType: SoilTypeSchema,
  currentCrop: z.string().optional(),
  plantedAt: z.string().datetime().optional(),
  expectedHarvestAt: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'FALLOW', 'PLANTED', 'HARVESTED']).default('ACTIVE'),
})

export const UpdateFieldSchema = CreateFieldSchema.partial()

// ─── Market Prices ───────────────────────────────────────────────────────────

export const MarketPriceQuerySchema = z.object({
  crop: z.string().optional(),
  county: z.string().optional(),
  region: z.string().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(20),
})

// ─── Credit ──────────────────────────────────────────────────────────────────

export const ComputeCreditSchema = z.object({
  userId: z.string().uuid().optional(), // admin only; defaults to current user
})

// ─── Loans ───────────────────────────────────────────────────────────────────

export const LoanApplicationSchema = z.object({
  amountKes: z.number().min(1000, 'Minimum loan is KES 1,000').max(5_000_000),
  purpose: z.enum([
    'SEEDS', 'FERTILIZER', 'PESTICIDES',
    'EQUIPMENT', 'IRRIGATION', 'LABOR', 'OTHER',
  ]),
  purposeDetails: z.string().max(500).optional(),
  termMonths: z.number().int().min(1).max(36),
})

// ─── AI Prediction ───────────────────────────────────────────────────────────

export const YieldPredictionSchema = z.object({
  crop: z.string().min(1),
  soilType: SoilTypeSchema,
  areaAcres: z.number().positive(),
  rainfallMm: z.number().min(0),
  tempAvgC: z.number().min(0).max(50),
  fertilizerUsed: z.boolean(),
  irrigated: z.boolean(),
  season: z.enum(['LONG_RAINS', 'SHORT_RAINS', 'DRY']),
})

// ─── USSD ────────────────────────────────────────────────────────────────────

export const UssdRequestSchema = z.object({
  sessionId: z.string(),
  serviceCode: z.string(),
  phoneNumber: z.string(),
  text: z.string(),
  networkCode: z.string().optional(),
})

// ─── Inferred types ──────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type CreateFarmInput = z.infer<typeof CreateFarmSchema>
export type UpdateFarmInput = z.infer<typeof UpdateFarmSchema>
export type CreateFieldInput = z.infer<typeof CreateFieldSchema>
export type UpdateFieldInput = z.infer<typeof UpdateFieldSchema>
export type MarketPriceQuery = z.infer<typeof MarketPriceQuerySchema>
export type LoanApplicationInput = z.infer<typeof LoanApplicationSchema>
export type YieldPredictionInput = z.infer<typeof YieldPredictionSchema>
export type UssdRequest = z.infer<typeof UssdRequestSchema>
