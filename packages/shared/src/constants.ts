// ─── Kenya Counties ───────────────────────────────────────────────────────────

export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
  'Wajir', 'West Pokot',
] as const

export type KenyanCounty = (typeof KENYA_COUNTIES)[number]

// ─── Agricultural Regions ────────────────────────────────────────────────────

export const AGRICULTURAL_REGIONS = {
  CENTRAL: ['Kiambu', 'Murang\'a', 'Nyandarua', 'Nyeri', 'Kirinyaga'],
  RIFT_VALLEY: ['Nakuru', 'Uasin Gishu', 'Trans Nzoia', 'Nandi', 'Kericho', 'Bomet', 'Laikipia', 'Baringo', 'Elgeyo-Marakwet', 'West Pokot', 'Narok', 'Kajiado'],
  WESTERN: ['Kakamega', 'Vihiga', 'Bungoma', 'Busia'],
  NYANZA: ['Kisumu', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'],
  EASTERN: ['Meru', 'Embu', 'Tharaka-Nithi', 'Machakos', 'Makueni', 'Kitui'],
  COAST: ['Mombasa', 'Kilifi', 'Kwale', 'Taita-Taveta', 'Lamu', 'Tana River'],
  NORTH_EASTERN: ['Garissa', 'Wajir', 'Mandera'],
  NORTHERN: ['Marsabit', 'Isiolo', 'Samburu', 'Turkana'],
  NAIROBI: ['Nairobi'],
} as const

// ─── Supported Crops ─────────────────────────────────────────────────────────

export const CROPS = [
  // Cereals
  'Maize', 'Wheat', 'Sorghum', 'Millet', 'Rice', 'Barley',
  // Legumes
  'Beans', 'Cowpeas', 'Green Grams', 'Soybean', 'Pigeon Peas',
  // Root crops
  'Potatoes', 'Sweet Potatoes', 'Cassava', 'Yams', 'Arrowroots',
  // Vegetables
  'Tomatoes', 'Kale', 'Spinach', 'Cabbage', 'Onions', 'Carrots',
  'Capsicum', 'Brinjal', 'Courgette', 'French Beans',
  // Fruits
  'Bananas', 'Mangoes', 'Avocados', 'Oranges', 'Passion Fruit',
  'Watermelon', 'Pineapples', 'Pawpaw',
  // Cash crops
  'Coffee', 'Tea', 'Pyrethrum', 'Sunflower', 'Sugarcane',
  'Macadamia', 'Vanilla',
] as const

export type Crop = (typeof CROPS)[number]

// ─── Credit scoring weights ───────────────────────────────────────────────────

export const CREDIT_SCORE_WEIGHTS = {
  farmSize: { max: 150, description: 'Farm size and land ownership' },
  activityLevel: { max: 150, description: 'Platform activity and data completeness' },
  loanHistory: { max: 200, description: 'Loan repayment history' },
  cropDiversity: { max: 100, description: 'Crop diversity and risk spread' },
  weatherRisk: { max: 100, description: 'Location-based weather risk' },
  marketAccess: { max: 100, description: 'Access to markets and buyers' },
  financialHistory: { max: 50, description: 'Mobile money transaction history' },
} as const

export const CREDIT_RATING_RANGES = [
  { min: 300, max: 499, rating: 'POOR', maxLoanKes: 10_000 },
  { min: 500, max: 599, rating: 'FAIR', maxLoanKes: 50_000 },
  { min: 600, max: 699, rating: 'GOOD', maxLoanKes: 150_000 },
  { min: 700, max: 749, rating: 'VERY_GOOD', maxLoanKes: 500_000 },
  { min: 750, max: 850, rating: 'EXCELLENT', maxLoanKes: 2_000_000 },
] as const

// ─── Loan constants ───────────────────────────────────────────────────────────

export const LOAN_INTEREST_RATES: Record<string, number> = {
  POOR: 18,
  FAIR: 15,
  GOOD: 12,
  VERY_GOOD: 10,
  EXCELLENT: 8,
}

// ─── Seasons (Kenya) ─────────────────────────────────────────────────────────

export const KENYA_SEASONS = {
  LONG_RAINS: { months: [3, 4, 5], name: 'Long Rains (March–May)' },
  SHORT_RAINS: { months: [10, 11, 12], name: 'Short Rains (Oct–Dec)' },
  DRY: { months: [1, 2, 6, 7, 8, 9], name: 'Dry Season' },
} as const

export function getCurrentSeason(): 'LONG_RAINS' | 'SHORT_RAINS' | 'DRY' {
  const month = new Date().getMonth() + 1
  if ([3, 4, 5].includes(month)) return 'LONG_RAINS'
  if ([10, 11, 12].includes(month)) return 'SHORT_RAINS'
  return 'DRY'
}
