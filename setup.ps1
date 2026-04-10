# AgriAI Africa — First-time setup
# Run this ONCE after cloning: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "🌱 AgriAI Africa — Setup" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

# 1. Check pnpm
Write-Host "1️⃣  Checking pnpm..." -ForegroundColor Cyan
try {
  $pnpmVersion = pnpm --version
  Write-Host "   ✅ pnpm $pnpmVersion found" -ForegroundColor Green
} catch {
  Write-Host "   ❌ pnpm not found. Installing..." -ForegroundColor Red
  npm install -g pnpm
}

# 2. Install all dependencies
Write-Host "`n2️⃣  Installing dependencies..." -ForegroundColor Cyan
pnpm install
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green

# 3. Check .env
Write-Host "`n3️⃣  Checking environment files..." -ForegroundColor Cyan
if (-Not (Test-Path "apps\backend\.env")) {
  Write-Host "   ⚠  apps\backend\.env not found — creating from example" -ForegroundColor Yellow
  Copy-Item "apps\backend\.env.example" "apps\backend\.env"
  Write-Host "   👉 Edit apps\backend\.env with your Supabase credentials!" -ForegroundColor Yellow
} else {
  Write-Host "   ✅ apps\backend\.env found" -ForegroundColor Green
}

if (-Not (Test-Path "apps\frontend\.env")) {
  Copy-Item "apps\frontend\.env.example" "apps\frontend\.env"
}

# 4. Generate Prisma client
Write-Host "`n4️⃣  Generating Prisma client..." -ForegroundColor Cyan
Set-Location apps\backend
npx prisma generate
Set-Location ..\..
Write-Host "   ✅ Prisma client generated" -ForegroundColor Green

# 5. Run migrations
Write-Host "`n5️⃣  Running database migrations..." -ForegroundColor Cyan
Write-Host "   Make sure your DATABASE_URL and DIRECT_URL in .env are correct!" -ForegroundColor Yellow
Set-Location apps\backend
npx prisma migrate dev --name init
Set-Location ..\..
Write-Host "   ✅ Migrations complete" -ForegroundColor Green

# 6. Seed the database
Write-Host "`n6️⃣  Seeding database..." -ForegroundColor Cyan
Set-Location apps\backend
npx prisma db seed
Set-Location ..\..
Write-Host "   ✅ Database seeded" -ForegroundColor Green

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Run '.\start.ps1' to start the app" -ForegroundColor White
Write-Host "`nDemo accounts:" -ForegroundColor Cyan
Write-Host "  Farmer → +254712345678 / Farmer@1234" -ForegroundColor White
Write-Host "  Admin  → +254700000001 / Admin@1234" -ForegroundColor White
