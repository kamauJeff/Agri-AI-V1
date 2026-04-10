import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Market prices (Kenya, realistic 2024 data) ──────────────────────────────

const PRICES = [
  // Nairobi
  { crop: 'Maize', region: 'Central', county: 'Nairobi', priceKes: 42, unit: 'KG' },
  { crop: 'Beans', region: 'Central', county: 'Nairobi', priceKes: 130, unit: 'KG' },
  { crop: 'Tomatoes', region: 'Central', county: 'Nairobi', priceKes: 85, unit: 'KG' },
  { crop: 'Potatoes', region: 'Central', county: 'Nairobi', priceKes: 38, unit: 'KG' },
  { crop: 'Kale', region: 'Central', county: 'Nairobi', priceKes: 28, unit: 'KG' },
  { crop: 'Onions', region: 'Central', county: 'Nairobi', priceKes: 60, unit: 'KG' },
  { crop: 'Carrots', region: 'Central', county: 'Nairobi', priceKes: 55, unit: 'KG' },
  { crop: 'Cabbage', region: 'Central', county: 'Nairobi', priceKes: 30, unit: 'KG' },
  { crop: 'Avocados', region: 'Central', county: 'Nairobi', priceKes: 20, unit: 'PIECE' },
  { crop: 'Bananas', region: 'Central', county: 'Nairobi', priceKes: 8, unit: 'PIECE' },

  // Nakuru (Rift Valley)
  { crop: 'Maize', region: 'Rift Valley', county: 'Nakuru', priceKes: 35, unit: 'KG' },
  { crop: 'Wheat', region: 'Rift Valley', county: 'Nakuru', priceKes: 52, unit: 'KG' },
  { crop: 'Potatoes', region: 'Rift Valley', county: 'Nakuru', priceKes: 28, unit: 'KG' },
  { crop: 'Beans', region: 'Rift Valley', county: 'Nakuru', priceKes: 115, unit: 'KG' },
  { crop: 'Tomatoes', region: 'Rift Valley', county: 'Nakuru', priceKes: 70, unit: 'KG' },
  { crop: 'Sunflower', region: 'Rift Valley', county: 'Nakuru', priceKes: 48, unit: 'KG' },
  { crop: 'Pyrethrum', region: 'Rift Valley', county: 'Nakuru', priceKes: 95, unit: 'KG' },
  { crop: 'Kale', region: 'Rift Valley', county: 'Nakuru', priceKes: 22, unit: 'KG' },

  // Uasin Gishu (Eldoret)
  { crop: 'Maize', region: 'Rift Valley', county: 'Uasin Gishu', priceKes: 33, unit: 'KG' },
  { crop: 'Wheat', region: 'Rift Valley', county: 'Uasin Gishu', priceKes: 50, unit: 'KG' },
  { crop: 'Soybean', region: 'Rift Valley', county: 'Uasin Gishu', priceKes: 90, unit: 'KG' },
  { crop: 'Sunflower', region: 'Rift Valley', county: 'Uasin Gishu', priceKes: 45, unit: 'KG' },
  { crop: 'Beans', region: 'Rift Valley', county: 'Uasin Gishu', priceKes: 110, unit: 'KG' },

  // Meru (Eastern)
  { crop: 'Maize', region: 'Eastern', county: 'Meru', priceKes: 40, unit: 'KG' },
  { crop: 'Beans', region: 'Eastern', county: 'Meru', priceKes: 125, unit: 'KG' },
  { crop: 'Potatoes', region: 'Eastern', county: 'Meru', priceKes: 32, unit: 'KG' },
  { crop: 'Tomatoes', region: 'Eastern', county: 'Meru', priceKes: 65, unit: 'KG' },
  { crop: 'Kale', region: 'Eastern', county: 'Meru', priceKes: 20, unit: 'KG' },
  { crop: 'Macadamia', region: 'Eastern', county: 'Meru', priceKes: 320, unit: 'KG' },
  { crop: 'Coffee', region: 'Eastern', county: 'Meru', priceKes: 480, unit: 'KG' },

  // Kiambu (Central)
  { crop: 'Coffee', region: 'Central', county: 'Kiambu', priceKes: 510, unit: 'KG' },
  { crop: 'Tea', region: 'Central', county: 'Kiambu', priceKes: 85, unit: 'KG' },
  { crop: 'Tomatoes', region: 'Central', county: 'Kiambu', priceKes: 78, unit: 'KG' },
  { crop: 'Kale', region: 'Central', county: 'Kiambu', priceKes: 25, unit: 'KG' },
  { crop: 'Avocados', region: 'Central', county: 'Kiambu', priceKes: 15, unit: 'PIECE' },
  { crop: 'Maize', region: 'Central', county: 'Kiambu', priceKes: 40, unit: 'KG' },

  // Murang'a (Central)
  { crop: 'Coffee', region: 'Central', county: "Murang'a", priceKes: 490, unit: 'KG' },
  { crop: 'Tea', region: 'Central', county: "Murang'a", priceKes: 80, unit: 'KG' },
  { crop: 'Avocados', region: 'Central', county: "Murang'a", priceKes: 12, unit: 'PIECE' },
  { crop: 'Bananas', region: 'Central', county: "Murang'a", priceKes: 6, unit: 'PIECE' },
  { crop: 'Maize', region: 'Central', county: "Murang'a", priceKes: 38, unit: 'KG' },

  // Kisumu (Nyanza)
  { crop: 'Maize', region: 'Nyanza', county: 'Kisumu', priceKes: 38, unit: 'KG' },
  { crop: 'Beans', region: 'Nyanza', county: 'Kisumu', priceKes: 120, unit: 'KG' },
  { crop: 'Tomatoes', region: 'Nyanza', county: 'Kisumu', priceKes: 72, unit: 'KG' },
  { crop: 'Sorghum', region: 'Nyanza', county: 'Kisumu', priceKes: 35, unit: 'KG' },
  { crop: 'Rice', region: 'Nyanza', county: 'Kisumu', priceKes: 90, unit: 'KG' },
  { crop: 'Fish', region: 'Nyanza', county: 'Kisumu', priceKes: 250, unit: 'KG' },

  // Mombasa / Kilifi (Coast)
  { crop: 'Cassava', region: 'Coast', county: 'Kilifi', priceKes: 25, unit: 'KG' },
  { crop: 'Coconuts', region: 'Coast', county: 'Kilifi', priceKes: 20, unit: 'PIECE' },
  { crop: 'Mangoes', region: 'Coast', county: 'Kilifi', priceKes: 15, unit: 'PIECE' },
  { crop: 'Cashew Nuts', region: 'Coast', county: 'Kilifi', priceKes: 280, unit: 'KG' },
  { crop: 'Pawpaw', region: 'Coast', county: 'Kilifi', priceKes: 30, unit: 'PIECE' },
  { crop: 'Tomatoes', region: 'Coast', county: 'Mombasa', priceKes: 90, unit: 'KG' },
  { crop: 'Kale', region: 'Coast', county: 'Mombasa', priceKes: 35, unit: 'KG' },
  { crop: 'Onions', region: 'Coast', county: 'Mombasa', priceKes: 70, unit: 'KG' },

  // Trans Nzoia (Rift Valley / Breadbasket)
  { crop: 'Maize', region: 'Rift Valley', county: 'Trans Nzoia', priceKes: 30, unit: 'KG' },
  { crop: 'Wheat', region: 'Rift Valley', county: 'Trans Nzoia', priceKes: 48, unit: 'KG' },
  { crop: 'Beans', region: 'Rift Valley', county: 'Trans Nzoia', priceKes: 108, unit: 'KG' },
  { crop: 'Soybean', region: 'Rift Valley', county: 'Trans Nzoia', priceKes: 88, unit: 'KG' },

  // Nyeri (Central)
  { crop: 'Tea', region: 'Central', county: 'Nyeri', priceKes: 82, unit: 'KG' },
  { crop: 'Coffee', region: 'Central', county: 'Nyeri', priceKes: 495, unit: 'KG' },
  { crop: 'Maize', region: 'Central', county: 'Nyeri', priceKes: 39, unit: 'KG' },
  { crop: 'Potatoes', region: 'Central', county: 'Nyeri', priceKes: 30, unit: 'KG' },
  { crop: 'Avocados', region: 'Central', county: 'Nyeri', priceKes: 14, unit: 'PIECE' },

  // Machakos / Makueni (Eastern)
  { crop: 'Maize', region: 'Eastern', county: 'Machakos', priceKes: 41, unit: 'KG' },
  { crop: 'Beans', region: 'Eastern', county: 'Machakos', priceKes: 122, unit: 'KG' },
  { crop: 'Mangoes', region: 'Eastern', county: 'Machakos', priceKes: 12, unit: 'PIECE' },
  { crop: 'Watermelon', region: 'Eastern', county: 'Machakos', priceKes: 18, unit: 'PIECE' },
  { crop: 'Tomatoes', region: 'Eastern', county: 'Makueni', priceKes: 68, unit: 'KG' },
  { crop: 'Green Grams', region: 'Eastern', county: 'Makueni', priceKes: 140, unit: 'KG' },
  { crop: 'Cowpeas', region: 'Eastern', county: 'Makueni', priceKes: 100, unit: 'KG' },

  // Kakamega (Western)
  { crop: 'Maize', region: 'Western', county: 'Kakamega', priceKes: 36, unit: 'KG' },
  { crop: 'Sugarcane', region: 'Western', county: 'Kakamega', priceKes: 4, unit: 'KG' },
  { crop: 'Beans', region: 'Western', county: 'Kakamega', priceKes: 112, unit: 'KG' },
  { crop: 'Bananas', region: 'Western', county: 'Kakamega', priceKes: 5, unit: 'PIECE' },
  { crop: 'Tea', region: 'Western', county: 'Kakamega', priceKes: 75, unit: 'KG' },

  // Bomet / Kericho (Tea country)
  { crop: 'Tea', region: 'Rift Valley', county: 'Kericho', priceKes: 78, unit: 'KG' },
  { crop: 'Tea', region: 'Rift Valley', county: 'Bomet', priceKes: 76, unit: 'KG' },
  { crop: 'Maize', region: 'Rift Valley', county: 'Kericho', priceKes: 37, unit: 'KG' },
  { crop: 'Pyrethrum', region: 'Rift Valley', county: 'Bomet', priceKes: 92, unit: 'KG' },
]

// ─── Seed users ──────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('👤 Seeding users...')

  const adminHash = await bcrypt.hash('Admin@1234', 12)
  const farmerHash = await bcrypt.hash('Farmer@1234', 12)

  await prisma.user.upsert({
    where: { phone: '+254700000001' },
    update: {},
    create: {
      name: 'AgriAI Admin',
      phone: '+254700000001',
      email: 'admin@agriai.africa',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  const farmer = await prisma.user.upsert({
    where: { phone: '+254712345678' },
    update: {},
    create: {
      name: 'John Kamau',
      phone: '+254712345678',
      email: 'john@example.com',
      passwordHash: farmerHash,
      role: 'FARMER',
    },
  })

  // Sample farm + fields for the demo farmer
  const existingFarm = await prisma.farm.findFirst({ where: { userId: farmer.id } })
  if (!existingFarm) {
    const farm = await prisma.farm.create({
      data: {
        userId: farmer.id,
        name: 'Kamau Family Farm',
        county: 'Nakuru',
        subCounty: 'Nakuru East',
        latitude: -0.3031,
        longitude: 36.0800,
        totalAreaAcres: 12,
      },
    })

    await prisma.field.createMany({
      data: [
        {
          farmId: farm.id,
          name: 'Maize Field A',
          areaAcres: 5,
          soilType: 'LOAM',
          currentCrop: 'Maize',
          plantedAt: new Date('2024-03-01'),
          expectedHarvestAt: new Date('2024-07-30'),
          status: 'PLANTED',
        },
        {
          farmId: farm.id,
          name: 'Tomato Greenhouse',
          areaAcres: 2,
          soilType: 'CLAY_LOAM',
          currentCrop: 'Tomatoes',
          plantedAt: new Date('2024-04-15'),
          expectedHarvestAt: new Date('2024-07-15'),
          status: 'PLANTED',
        },
        {
          farmId: farm.id,
          name: 'Wheat Block',
          areaAcres: 5,
          soilType: 'LOAM',
          currentCrop: 'Wheat',
          plantedAt: new Date('2024-01-10'),
          expectedHarvestAt: new Date('2024-05-20'),
          status: 'HARVESTED',
        },
      ],
    })

    console.log('🌾 Sample farm and fields created')
  }

  console.log('✅ Users seeded')
}

// ─── Seed market prices ──────────────────────────────────────────────────────

async function seedMarketPrices() {
  console.log('📊 Seeding market prices...')

  // Clear existing prices and re-seed fresh
  await prisma.cropPrice.deleteMany()

  // Create prices with slight variation over the past 30 days
  const records = []
  for (const price of PRICES) {
    // Create 4 price records over past month to simulate history
    for (let daysAgo = 0; daysAgo <= 30; daysAgo += 10) {
      const variation = 0.9 + Math.random() * 0.2 // ±10% variation
      records.push({
        ...price,
        unit: price.unit as any,
        priceKes: Math.round(price.priceKes * variation),
        recordedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      })
    }
  }

  await prisma.cropPrice.createMany({ data: records })
  console.log(`✅ ${records.length} price records seeded`)
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting AgriAI database seed...\n')

  await seedUsers()
  await seedMarketPrices()

  console.log('\n🎉 Seed complete!')
  console.log('\nTest accounts:')
  console.log('  Admin  → phone: +254700000001  password: Admin@1234')
  console.log('  Farmer → phone: +254712345678  password: Farmer@1234')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
