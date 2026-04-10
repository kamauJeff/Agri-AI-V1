import type { YieldPredictionInput, YieldPrediction, SoilType } from '@agriai/shared'

// Kenya-specific baseline yields (kg/acre) per crop under average conditions
const BASELINE_YIELDS: Record<string, number> = {
  Maize: 900, Wheat: 700, Sorghum: 600, Millet: 500, Rice: 1200, Barley: 650,
  Beans: 400, Cowpeas: 350, 'Green Grams': 300, Soybean: 500, 'Pigeon Peas': 380,
  Potatoes: 5000, 'Sweet Potatoes': 4000, Cassava: 3500, Yams: 3000, Arrowroots: 2800,
  Tomatoes: 8000, Kale: 5000, Spinach: 4500, Cabbage: 6000, Onions: 4000,
  Carrots: 4500, Capsicum: 3500, 'French Beans': 2000, Brinjal: 3500, Courgette: 3000,
  Bananas: 6000, Mangoes: 2500, Avocados: 2000, Oranges: 3000, 'Passion Fruit': 4000,
  Watermelon: 7000, Pineapples: 5000, Pawpaw: 4500,
  Coffee: 400, Tea: 3000, Pyrethrum: 500, Sunflower: 600, Sugarcane: 50000, Macadamia: 800,
}

// Soil type multipliers for yield
const SOIL_MULTIPLIERS: Record<SoilType, number> = {
  LOAM: 1.0,
  CLAY_LOAM: 0.95,
  SANDY_LOAM: 0.88,
  SILT: 0.93,
  CLAY: 0.82,
  SANDY: 0.72,
  PEAT: 0.90,
  CHALK: 0.78,
}

// Season multipliers
const SEASON_MULTIPLIERS: Record<string, number> = {
  LONG_RAINS: 1.0,
  SHORT_RAINS: 0.85,
  DRY: 0.55,
}

// Optimal rainfall ranges per crop (mm for season) [min, max]
const OPTIMAL_RAINFALL: Record<string, [number, number]> = {
  Maize: [400, 800], Wheat: [300, 600], Rice: [800, 1500],
  Potatoes: [500, 900], Tomatoes: [400, 700], Beans: [300, 600],
  Coffee: [1200, 2000], Tea: [1500, 2500], Sugarcane: [1000, 1800],
  DEFAULT: [300, 800],
}

function getRainfallMultiplier(crop: string, rainfallMm: number): number {
  const [min, max] = OPTIMAL_RAINFALL[crop] ?? OPTIMAL_RAINFALL.DEFAULT
  if (rainfallMm < min * 0.5) return 0.50  // severe drought
  if (rainfallMm < min) return 0.75
  if (rainfallMm <= max) return 1.0         // optimal
  if (rainfallMm <= max * 1.5) return 0.88  // waterlogging risk
  return 0.70                               // flood risk
}

function getTempMultiplier(crop: string, tempC: number): number {
  // Most Kenya crops thrive 15–28°C
  if (tempC < 10) return 0.60
  if (tempC < 15) return 0.85
  if (tempC <= 28) return 1.0
  if (tempC <= 33) return 0.90
  return 0.72
}

export function predictYield(input: YieldPredictionInput): YieldPrediction {
  const {
    crop, soilType, areaAcres, rainfallMm, tempAvgC,
    fertilizerUsed, irrigated, season,
  } = input

  const baseYieldPerAcre = BASELINE_YIELDS[crop] ?? 800

  // Apply multipliers
  const soilMult = SOIL_MULTIPLIERS[soilType] ?? 0.85
  const seasonMult = SEASON_MULTIPLIERS[season] ?? 0.85
  const rainfallMult = irrigated ? Math.max(getRainfallMultiplier(crop, rainfallMm), 0.90) : getRainfallMultiplier(crop, rainfallMm)
  const tempMult = getTempMultiplier(crop, tempAvgC)
  const fertMult = fertilizerUsed ? 1.25 : 1.0

  const adjustedYieldPerAcre = baseYieldPerAcre * soilMult * seasonMult * rainfallMult * tempMult * fertMult
  const predictedYieldKg = adjustedYieldPerAcre * areaAcres

  // Confidence: reduce when input conditions are extreme
  let confidence = 82
  if (rainfallMm < 200 && !irrigated) confidence -= 15
  if (tempAvgC > 35) confidence -= 10
  if (season === 'DRY' && !irrigated) confidence -= 12
  if (!BASELINE_YIELDS[crop]) confidence -= 10
  confidence = Math.max(40, Math.min(95, confidence))

  // Market price estimate (rough KES/kg)
  const PRICE_EST: Record<string, number> = {
    Maize: 40, Wheat: 55, Tomatoes: 80, Potatoes: 35, Beans: 120,
    Coffee: 500, Tea: 80, Avocados: 150, Bananas: 30, Kale: 25,
    DEFAULT: 60,
  }
  const pricePerKg = PRICE_EST[crop] ?? PRICE_EST.DEFAULT
  const estimatedRevenueKes = predictedYieldKg * pricePerKg

  // Recommendations
  const recommendations: string[] = []
  if (!fertilizerUsed) recommendations.push('Apply balanced NPK fertilizer to boost yield by up to 25%.')
  if (!irrigated && season === 'DRY') recommendations.push('Install drip irrigation — critical during dry season.')
  if (soilType === 'SANDY') recommendations.push('Add organic matter to improve water retention in sandy soil.')
  if (soilType === 'CLAY') recommendations.push('Improve drainage — waterlogging can reduce yield by 18–30%.')
  if (rainfallMm < 300 && !irrigated) recommendations.push('Consider drought-tolerant crop varieties.')
  if (tempAvgC > 30) recommendations.push('Use shade netting and mulching to manage heat stress.')
  if (recommendations.length === 0) recommendations.push('Conditions are good. Maintain crop monitoring schedule.')

  // Risk factors
  const riskFactors: string[] = []
  if (season === 'DRY' && !irrigated) riskFactors.push('High drought risk — no irrigation in dry season.')
  if (rainfallMm > 1200) riskFactors.push('Excess rainfall may cause waterlogging and fungal disease.')
  if (tempAvgC > 33) riskFactors.push('Heat stress can damage crops during flowering stage.')
  if (soilType === 'SANDY') riskFactors.push('Sandy soil has poor nutrient retention.')
  if (riskFactors.length === 0) riskFactors.push('No major risk factors identified under current conditions.')

  return {
    cropName: crop,
    predictedYieldKg: Math.round(predictedYieldKg),
    predictedYieldPerAcre: Math.round(adjustedYieldPerAcre),
    confidencePct: confidence,
    estimatedRevenueKes: Math.round(estimatedRevenueKes),
    recommendations,
    riskFactors,
  }
}
