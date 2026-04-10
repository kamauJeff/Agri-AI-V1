# AgriAI Africa 🌱

> Empowering smallholder farmers with data-driven insights, financial access, and market connections.

## Tech stack

| Layer | Technology | Deploy |
|---|---|---|
| Backend | Node.js · Express · Prisma · PostgreSQL | Railway |
| Frontend | React · Vite · Tailwind · shadcn/ui · React Query | Vercel |
| Mobile | Expo · React Native · Expo Router | EAS |
| Shared | TypeScript · Zod schemas · constants | pnpm workspace |

## Features

- **Auth** — JWT access + refresh token rotation, RBAC
- **Farm management** — CRUD farms and fields with map picker
- **Weather** — 7-day hyperlocal forecast + weather alert detection
- **Market prices** — Live Kenya crop prices, 30-day trend charts
- **Credit scoring** — 6-factor algorithmic score (300–850)
- **Loans** — Apply, repayment schedule, EMI preview
- **AI yield prediction** — Kenya-specific crop yield model
- **USSD/SMS** — Africa's Talking for basic phone access

## Quick start (Windows PowerShell)

```powershell
git clone https://github.com/yourusername/agriai-africa.git
cd agriai-africa

# 1. Fill in apps/backend/.env with Supabase credentials
# 2. Run setup:
.\setup.ps1

# 3. Start development:
.\start.ps1
```

## Daily commands

```bash
pnpm dev              # backend + frontend together
pnpm dev:backend      # http://localhost:3000
pnpm dev:frontend     # http://localhost:5173
pnpm dev:mobile       # Expo (set EXPO_PUBLIC_API_URL to your local IP)

pnpm db:migrate       # run migrations
pnpm db:seed          # seed market prices + demo users
pnpm db:studio        # Prisma visual browser
```

## Demo accounts (after seeding)

| Role | Phone | Password |
|---|---|---|
| Farmer | +254712345678 | Farmer@1234 |
| Admin | +254700000001 | Admin@1234 |

## Environment

### `apps/backend/.env`
```
DATABASE_URL="postgresql://postgres.REF:PASS@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASS@db.REF.supabase.co:5432/postgres"
JWT_ACCESS_SECRET="random-string"
JWT_REFRESH_SECRET="another-random-string"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
OPENWEATHER_API_KEY="get-from-openweathermap.org"
AT_API_KEY="get-from-africastalking.com"
AT_USERNAME="sandbox"
```

### `apps/frontend/.env`
```
VITE_API_URL=http://localhost:3000/api
```

### `apps/mobile/.env`
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

## Deployment

**Backend → Railway:** Push repo, connect to Railway, add env vars, auto-deploys via `railway.toml`.

**Frontend → Vercel:** Import repo, set root dir `apps/frontend`, add `VITE_API_URL` env var.

**Mobile → EAS:**
```bash
cd apps/mobile && eas build --platform android --profile preview
```

## Structure

```
agriai-africa/
├── apps/backend/    # Express API — controllers, routes, services, middleware
├── apps/frontend/   # React SPA — pages, components, hooks, store
├── apps/mobile/     # Expo RN — screens for all 6 features + auth
└── packages/shared/ # Shared types, Zod schemas, Kenya constants
```
