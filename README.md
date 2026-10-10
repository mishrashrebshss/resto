# RestoQR SaaS

A full-stack restaurant management platform built with Express, Vite, React 19, and TypeScript.

## Features

- **Multi-tenant restaurant management** — owners, managers, kitchen staff, and waiters each have dedicated dashboards
- **QR code ordering** — customers scan a table QR code to browse the menu and place orders
- **Live updates via SSE** — kitchen display and floor portal receive real-time order notifications
- **AI-powered menu descriptions** — generate marketing copy with Gemini
- **Cloud sync with Supabase** — optional Postgres backend; falls back to local JSON DB
- **Production-ready security** — JWT auth, CSRF protection, Zod input validation, rate limiting

## Quick Start

```bash
# Install (use --legacy-peer-deps due to esbuild/Vite conflict)
npm install --legacy-peer-deps

# Configure
cp .env.example .env
# Edit .env and set JWT_SECRET, ADMIN_PASSWORD, etc.

# Development
npm run dev

# Production
npm run build && npm start
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with Vite + Express |
| `npm run build` | Build frontend for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint (0 errors required) |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run test suite |

## Environment Variables

See [ENVIRONMENT.md](ENVIRONMENT.md) for the full reference.

- `JWT_SECRET` (required in production) — secret for signing JWT tokens
- `ADMIN_PASSWORD` — admin panel password
- `PORT` — server port (default: 3000)

## Docker

```bash
docker build -t restoqr . && docker run -p 3000:3000 --env-file .env restoqr
```

## Architecture

- **Server**: `server.ts` (Express, Vite middleware in dev, static SPA in prod)
- **API**: `src/server/routes.ts` (Zod validation, rate limiting, CSRF protection)
- **Database**: `src/server/db.ts` (JSON file singleton, optional Supabase sync)
- **Frontend**: Vite + React 19 + React Router DOM v7

## Health Check

`GET /api/health` — returns `{ status, timestamp, uptime }`
