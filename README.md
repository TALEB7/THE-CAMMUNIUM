# The Communium

**Professional Networking Platform for Morocco** 🇲🇦

## Project Structure (Monorepo)

```
stg/
├── apps/
│   ├── client/          # Next.js 14 frontend
│   └── server/          # NestJS backend API
├── packages/
│   ├── database/        # Prisma schema & migrations
│   └── shared/          # Shared types, constants, validators
├── docker-compose.yml   # PostgreSQL, Redis, Meilisearch
├── turbo.json           # Turborepo configuration
└── pnpm-workspace.yaml  # Workspace packages
```

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** & Docker Compose

## Getting Started

### 1. Install Node.js & pnpm

```bash
# Download and install Node.js from https://nodejs.org/
# Then install pnpm globally:
npm install -g pnpm
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
# Edit .env with your actual API keys:
# - Clerk keys (auth)
# - Stripe keys (payments)
# - Database URL (or use Docker default)
```

### 4. Start Docker services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Meilisearch** on port 7700

### 5. Setup database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed demo data
pnpm db:seed
```

### 6. Start development servers

```bash
pnpm dev
```

This starts:
- **Frontend** at http://localhost:3000
- **Backend API** at http://localhost:4000/api
- **API Docs** at http://localhost:4000/api/docs

## Phase 1 Features

- ✅ Authentication (Clerk)
- ✅ Personal & Business profiles
- ✅ Membership plans (200/500/3000 Dhs)
- ✅ Stripe & CMI payment integration
- ✅ Tks token system (earn & spend)
- ✅ Profile search

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | Next.js 14, Tailwind, shadcn  |
| Backend   | NestJS, Prisma, PostgreSQL    |
| Auth      | Clerk                         |
| Payments  | Stripe + CMI                  |
| Search    | Meilisearch                   |
| Cache     | Redis                         |
| Monorepo  | Turborepo + pnpm              |

## License

Private — The Communium © 2024
