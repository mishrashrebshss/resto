# AGENTS.md - RestoQR Production Development Guide

## Commands

### Development
```bash
npm run dev          # Start dev server (tsx server.ts)
```

### Build & Deploy
```bash
npm run build        # Build frontend via Vite
npm run start         # Start production server (tsx server.ts)
```

### Quality
```bash
npm run lint          # ESLint (0 errors, warnings acceptable)
npm run typecheck     # TypeScript type checking
npm test              # Run tests (vitest run)
npm run test:watch    # Watch mode for tests
```

### Dependencies
```bash
npm install --legacy-peer-deps  # Due to esbuild/Vite peer conflict
```

## Architecture

- **Server**: `server.ts` — Express server that serves Vite dev middleware in development or static SPA in production
- **API**: `src/server/routes.ts` — All Express routes with Zod validation, rate limiting, CSRF protection
- **Database**: `src/server/db.ts` — JSON file-based singleton DB with optional Supabase sync
- **Frontend**: Vite + React 19, no Next.js
- **Routing**: React Router DOM v7 (migrated from custom router in `App.tsx`)

## Key Patterns

- All API requests include CSRF tokens (auto-fetched on app load, stored in `localStorage`)
- JWT secrets required at startup in production (`JWT_SECRET` env var)
- All inputs validated via Zod schemas in `src/server/validation.ts`
- Rate limiting: 5 req/15min for login, 100 req/15min for public endpoints
- ErrorBoundary wraps the root app to catch uncaught React errors
