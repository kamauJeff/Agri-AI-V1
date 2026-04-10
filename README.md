# AgriAI Africa 🌱

> Empowering smallholder farmers with data-driven insights, financial access, and market connections.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express · Prisma · PostgreSQL |
| Frontend | React · Vite · Tailwind CSS · shadcn/ui · React Query · Zustand |
| Mobile | Expo React Native (Phase 2) |
| Deploy | Railway (backend + DB) · Vercel (frontend) · EAS (mobile) |
| Infra | pnpm workspaces monorepo |

## Features (v1)

- **Auth** — JWT access + refresh token rotation, httpOnly cookies, RBAC
- **Farm management** — CRUD farms and fields with Leaflet map picker
- **Weather** — 7-day hyperlocal forecast + extreme weather alert detection
- **Market prices** — Live Kenya crop prices with 30-day trend charts
- **Credit scoring** — 6-factor algorithmic score (300–850), 24h cache
- **Loans** — Apply, approve, disburse, repayment schedule, auto-close
- **AI yield prediction** — Kenya-specific baseline model with soil/season/climate multipliers
- **USSD/SMS** — Africa's Talking integration for basic phone access

## Project structure

```
agriai-africa/
├── apps/
│   ├── backend/          # Express API
│   │   ├── prisma/       # Schema + seed
│   │   └── src/
│   │       ├── controllers/
│   │       ├── routes/
│   │       ├── services/
│   │       └── middleware/
│   ├── frontend/         # React SPA
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── api/
│   │       └── store/
│   └── mobile/           # Expo (Phase 2)
└── packages/
    └── shared/           # Types, Zod schemas, constants
```

## Getting started

### Prerequisites
- Node.js 18+
- pnpm 9+ (`npm i -g pnpm`)
- PostgreSQL (Railway or local)

### 1. Install dependencies
```bash
git clone https://github.com/yourusername/agriai-africa.git
cd agriai-africa
pnpm install
```

### 2. Configure environment

**Backend:**
```bash
cd apps/backend
cp .env.example .env
# Fill in: DATABASE_URL, DIRECT_URL, JWT secrets, OPENWEATHER_API_KEY, AT_API_KEY
```

**Frontend:**
```bash
cd apps/frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000/api
```

### 3. Set up the database
```bash
pnpm db:migrate   # run migrations
pnpm db:seed      # seed counties, crops, prices + demo accounts
```

### 4. Start development
```bash
# From repo root — two terminals:
pnpm dev:backend    # → http://localhost:3000
pnpm dev:frontend   # → http://localhost:5173
```

### Demo accounts (after seed)
| Role | Phone | Password |
|---|---|---|
| Admin | +254700000001 | Admin@1234 |
| Farmer | +254712345678 | Farmer@1234 |

## API reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Farms & Fields
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/farms` | List user's farms |
| POST | `/api/farms` | Create farm |
| GET | `/api/farms/:id` | Get farm details |
| PATCH | `/api/farms/:id` | Update farm |
| DELETE | `/api/farms/:id` | Delete farm |
| GET | `/api/farms/:farmId/fields` | List fields |
| POST | `/api/farms/:farmId/fields` | Create field |

### Weather
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/weather/:farmId/forecast` | 7-day forecast |
| GET | `/api/weather/:farmId/alerts` | Active weather alerts |

### Market
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/market/prices` | Paginated prices (filterable) |
| GET | `/api/market/prices/latest` | Latest price per crop/county |
| GET | `/api/market/prices/:crop/trend` | 30-day price trend |

### Credit
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/credit/score` | Get/compute score |
| POST | `/api/credit/score/refresh` | Force recompute |
| GET | `/api/credit/score/history` | Score history |

### Loans
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/loans` | List user loans |
| POST | `/api/loans/apply` | Apply for loan |
| POST | `/api/loans/:id/repay` | Record repayment |

### AI Prediction
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/predict` | Get yield prediction |
| POST | `/api/predict/field/:fieldId` | Predict + save to field |

### USSD (Africa's Talking)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/ussd` | USSD session handler |

## Deployment

### Backend → Railway
1. Create Railway project, add PostgreSQL service
2. Add environment variables from `.env.example`
3. Connect GitHub repo, Railway auto-deploys on push
4. Run `pnpm db:migrate` from Railway CLI

### Frontend → Vercel
1. Import repo in Vercel, set root to `apps/frontend`
2. Add `VITE_API_URL=https://your-railway-backend.up.railway.app/api`
3. Deploy

## Roadmap

### Phase 2 (next)
- [ ] Expo mobile app with offline support
- [ ] SMS notifications for weather alerts and loan reminders
- [ ] Google Maps integration for farm boundary drawing
- [ ] M-Pesa disbursement and repayment

### Phase 3
- [ ] Investor matching platform
- [ ] Group buying module
- [ ] Post-harvest cold storage connections
- [ ] AI voice assistant (Swahili)
- [ ] Alternative credit scoring via satellite imagery

## License
MIT — built with ❤️ for African farmers
