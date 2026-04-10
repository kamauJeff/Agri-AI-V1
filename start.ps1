# AgriAI Africa — Start all services
# Usage: .\start.ps1
# Or run individually: .\start.ps1 backend | frontend | mobile

param([string]$service = "all")

$ErrorActionPreference = "Stop"

Write-Host "🌱 AgriAI Africa" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

function Start-Backend {
  Write-Host "`n🚀 Starting backend on http://localhost:3000" -ForegroundColor Cyan
  Set-Location apps\backend
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm dev" -PassThru
  Set-Location ..\..
}

function Start-Frontend {
  Write-Host "`n🖥  Starting frontend on http://localhost:5173" -ForegroundColor Blue
  Set-Location apps\frontend
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm dev" -PassThru
  Set-Location ..\..
}

function Start-Mobile {
  Write-Host "`n📱 Starting Expo mobile app" -ForegroundColor Yellow
  Write-Host "⚠  Make sure EXPO_PUBLIC_API_URL in apps/mobile/.env points to your local IP" -ForegroundColor Yellow
  Set-Location apps\mobile
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx expo start" -PassThru
  Set-Location ..\..
}

switch ($service) {
  "backend"  { Start-Backend }
  "frontend" { Start-Frontend }
  "mobile"   { Start-Mobile }
  "all" {
    Start-Backend
    Start-Sleep -Seconds 2
    Start-Frontend
    Write-Host "`n✅ Backend + Frontend started!" -ForegroundColor Green
    Write-Host "   Backend  → http://localhost:3000" -ForegroundColor White
    Write-Host "   Frontend → http://localhost:5173" -ForegroundColor White
    Write-Host "`nRun '.\start.ps1 mobile' separately when ready for mobile" -ForegroundColor Gray
  }
}
