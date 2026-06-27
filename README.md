# Foundation

**Intelligent construction finance orchestration.** Foundation connects your project schedule to your bank feed — invoices aren't isolated documents, they're milestones tied to real-world triggers like passed inspections, completed phases, and cleared payments.

## Features

- **Project Schedule Builder** — phase-based structuring, milestone tracking, drag-and-drop reordering, document vault
- **Financial Dashboard** — real-time metric cards, cash flow burn-down chart, proactive alerts, one-click report export
- **Bank Sync Transaction Matcher** — Plaid-powered bank feed, AI-suggested milestone matches, split-payment utility, QuickBooks write-back

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, React Router, React Markdown |
| Backend | NestJS (TypeScript), strict type safety, integer currency values |
| Database | PostgreSQL + TimescaleDB, Redis cache |
| Auth | Auth0 (MFA required) |
| Integrations | Plaid (bank sync), Stripe, QuickBooks Online, Claude API |
| Queue | BullMQ (Redis-backed async jobs) |

## Quick Start

```bash
# Install dependencies and start all services
./init.sh
```

**Access the app:** http://localhost:5173 | API docs: http://localhost:3001/api/docs

### Manual Start (step by step)

**1. Install dependencies**
```bash
cd client && pnpm install
cd ../server && pnpm install
```

**2. Start PostgreSQL and Redis**
```bash
docker compose up -d postgres redis
```

**3. Run database migrations**
```bash
cd server && pnpm run migration:run
```

**4. Start the backend (NestJS on port 3001)**
```bash
cd server && pnpm run start:dev
```

**5. Start the frontend (Vite on port 5173) — in a separate terminal**
```bash
cd client && pnpm run dev
```

## Project Structure

```
Foundation/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # React context providers
│   │   └── lib/          # API client, utilities
│   └── vite.config.ts
├── server/          # NestJS backend
│   ├── src/
│   │   ├── auth/         # Auth0 guards and decorators
│   │   ├── projects/     # Projects, phases, milestones modules
│   │   ├── finance/      # Dashboard, alerts, reports modules
│   │   ├── bank-sync/    # Plaid, transactions, reconciliation modules
│   │   ├── quickbooks/   # QBO OAuth and write-back module
│   │   └── database/     # TypeORM entities and migrations
│   └── nest-cli.json
├── feature_list.json   # End-to-end test cases (source of truth)
├── init.sh             # Environment setup script
└── docker-compose.yml  # PostgreSQL + Redis + TimescaleDB
```

## Required Environment Variables

Create a `.env` file in `server/`:

```env
# Claude API (file reference — do not commit actual key)
ANTHROPIC_API_KEY=$(cat /tmp/api-key)

# Database
DATABASE_URL=postgresql://foundation:foundation@localhost:5432/foundation
REDIS_URL=redis://localhost:6379

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_AUDIENCE=https://api.foundation.app

# Plaid
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox

# QuickBooks
QB_CLIENT_ID=...
QB_CLIENT_SECRET=...
QB_REDIRECT_URI=http://localhost:3001/api/integrations/quickbooks/callback

# App
FRONTEND_URL=http://localhost:5173
JWT_SECRET=...
```

## Development

```bash
# Backend only
cd server && pnpm run start:dev

# Frontend only
cd client && pnpm run dev

# Run migrations
cd server && pnpm run migration:run

# Run tests
cd server && pnpm test
cd client && pnpm test
```

## Feature Progress

All 20 end-to-end test cases are tracked in `feature_list.json`. Features are marked `"passes": true` only after full implementation and manual verification. Never remove or edit existing test cases — only mark them passing.
