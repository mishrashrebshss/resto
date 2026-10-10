# RestoQR Environment Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and fill in the values.

## Required (Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for signing JWT tokens. **Must be at least 32 characters.** | `my-super-secret-key-change-in-production` |
| `DATABASE_URL` | (Optional) Supabase database URL. Leave empty for JSON file DB. | `https://xyz.supabase.co` |

## Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the Express server listens on. |
| `NODE_ENV` | `development` | Set to `production` for production mode. |
| `SUPABASE_URL` | | Supabase project URL for cloud sync. |
| `SUPABASE_ANON_KEY` | | Supabase anonymous key for client-side queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | | Supabase service role key for server-side admin operations. |
| `GEMINI_API_KEY` | | Google Gemini API key for AI menu description generation. |
| `NEXT_PUBLIC_APP_NAME` | `RestoQR` | Display name used in the UI. |

## Seed Passwords

For development and initial setup. All seed accounts use `admin@example.com` by default.

| Variable | Role | Default | Description |
|----------|------|---------|-------------|
| `SEED_ADMIN_PASSWORD` | Admin | `admin123` | Password for the seeded admin account. |
| `OWNER_PASSWORD` | Restaurant Owner | `owner123` | Password for the seeded owner account. |
| `KITCHEN_PASSWORD` | Kitchen Staff | `kitchen123` | Password for the seeded kitchen staff account. |
| `WAITER_PASSWORD` | Waiter Staff | `waiter123` | Password for the seeded waiter account. |
| `SEED_ADMIN_EMAIL` | Admin | `admin@example.com` | Email for the seeded admin account. |
| `SEED_ADMIN_EMAIL2` | Admin 2 | `admin2@example.com` | Email for a second seeded admin account. |

## AI Configuration

| Variable | Description |
|----------|-------------|
| `AI_ENABLED` | Set to `true` to enable AI features (menu description generation, etc.). |
| `AI_MODEL` | The AI model identifier (e.g., `gemini-2.0-flash`). |
| `AI_MAX_TOKENS` | Max tokens for AI-generated content (default: `500`). |
| `AI_TEMPERATURE` | Creativity temperature (default: `0.7`). |

## Rate Limiting

Defaults are pre-configured in the application. No env vars needed unless customizing.

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 requests per 15 minutes |
| Public endpoints | 100 requests per 15 minutes |

## CSRF Protection

CSRF tokens are automatically fetched on app load and stored in `localStorage` under `restoqr_csrf_token`. They are sent with all state-changing requests (POST, PUT, PATCH, DELETE) via the `X-CSRF-Token` header.

## Security Notes

- Never commit `.env` files to version control.
- Always use a strong `JWT_SECRET` in production (at least 32 characters).
- The `SUPABASE_SERVICE_ROLE_KEY` grants admin access — treat it like a password.
- Seed passwords should be changed after first login in production.
