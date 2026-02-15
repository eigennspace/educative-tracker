# Educative Learning Progress Tracker

Local-first web app for tracking Educative.io learning progress with offline-friendly SQLite storage.

## Stack
- Backend: Node.js, Express, SQLite (`better-sqlite3`), Zod
- Frontend: React (Vite), TailwindCSS, Recharts
- Runtime: npm workspaces with one-command startup

## Current Capabilities
- JWT auth with access/refresh tokens (`register`, `login`, `refresh`)
- Forgot/reset password flow with one-time reset tokens (dev reset link mode supported)
- Strong user isolation on courses, sessions, progress, dashboard, and analytics
- Course progress toggles including range-complete (`applyToPrevious` for lessons `1..N`)
- Responsive UI with mobile card layouts for courses/sessions
- Accessibility-first improvements:
  - focus-managed confirmation modal
  - semantic progress indicators
  - clearer form labels/help text/error states
- Frontend performance optimizations:
  - route-level lazy loading (`React.lazy` + `Suspense`)
  - isolated chart bundle (`recharts` manual chunk)

## Project Structure
- `docs/ARCHITECTURE.md`: architecture, schema, API contract, implementation phases
- `docs/AUTH_ISOLATION_PLAN.md`: auth and tenant-isolation hardening plan/status
- `backend/`: REST API + migrations + seed
- `frontend/`: React UI

## Quick Start
1. Install dependencies:
```bash
npm install
```

2. Copy env file:
```bash
cp .env.example .env
```

3. Run migrations and seed:
```bash
npm run migrate
npm run seed
```

4. Start backend + frontend:
```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:4000/api`

## Scripts
- `npm run dev`: start backend + frontend concurrently
- `npm run migrate`: run backend migrations
- `npm run seed`: seed sample data
- `npm run test -w backend`: backend integration tests
- `npm run test -w frontend`: frontend integration tests
- `npm run build -w frontend`: frontend production build
- `npm run docker:up`: build and start Docker services
- `npm run docker:up:prod`: build and start Docker services with production override
- `npm run docker:down`: stop Docker services
- `npm run docker:down:prod`: stop Docker services with production override
- `npm run docker:logs`: stream Docker logs
- `npm run docker:logs:prod`: stream Docker logs with production override
- `npm run docker:ps`: list Docker containers
- `npm run docker:ps:prod`: list Docker containers with production override

## Docker Deployment

Production-style containerization is available with:
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf` (SPA + `/api` reverse proxy to backend)
- `docker-compose.yml`
- `scripts/docker.sh` helper script

### Start
```bash
./scripts/docker.sh up
```
or
```bash
npm run docker:up
```

### Start (production override)
```bash
./scripts/docker.sh up-prod
```
or
```bash
npm run docker:up:prod
```

### Stop
```bash
./scripts/docker.sh down
```

Production override:
```bash
./scripts/docker.sh down-prod
```

### Logs
```bash
./scripts/docker.sh logs
```

Production override:
```bash
./scripts/docker.sh logs-prod
```

### URLs
- Base compose:
  - Frontend: `http://localhost:8080`
  - Backend health: `http://localhost:4000/api/health`
- Production override:
  - Frontend: `http://localhost:8080`
  - Backend is internal-only (not published to host)

### Data persistence
- SQLite database is persisted in Docker named volume: `educative_db_data`.
- Backend runs migrations automatically on container startup.

### Environment variables
- Docker Compose reads values from your root `.env` file automatically.
- At minimum, set strong values for:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
- In production override (`docker-compose.prod.yml`):
  - backend port is not published to host (`ports: []`, internal `expose: 4000` only)
  - `EXPOSE_RESET_TOKEN=false`
  - tighter healthcheck settings

## API Summary
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET/POST/PATCH/DELETE /api/courses`
- `GET /api/courses/:id/progress`
- `POST /api/courses/:id/progress/toggle`
- `GET/POST/PATCH/DELETE /api/sessions`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/weekly`
- `GET /api/analytics/heatmap?year=YYYY`
- `GET /api/analytics/insights`

All endpoints except `/api/health` and `/api/auth/*` require:
`Authorization: Bearer <access_token>`

## Local-first Behavior
- SQLite file lives at `backend/data/educative_tracker.db` (configurable via `DB_PATH`).
- App remains functional with local DB only.
- Seed inserts default user and sample data.

## Frontend Performance Notes
- App routes are lazy-loaded from `frontend/src/App.jsx`.
- Dashboard chart code is lazily loaded from `frontend/src/features/dashboard/WeeklyTrendChart.jsx`.
- Vite manual chunking isolates `recharts` in `frontend/vite.config.js`.

## Migration Strategy (SQLite -> PostgreSQL)
1. Keep REST contract stable; extract current service-layer SQL into a DB-adapter/repository abstraction.
2. Replace SQLite datetime functions with DB-agnostic query builders/SQL dialect mapping.
3. Migrate `INTEGER PRIMARY KEY AUTOINCREMENT` to PostgreSQL `BIGSERIAL`/`GENERATED` IDs.
4. Convert boolean-like integer fields (`is_completed`, `is_archived`) to native `BOOLEAN`.
5. Move raw migrations to a migration tool (Prisma/Knex/Drizzle/Flyway) when cloud rollout begins.
6. Keep auth/session contract stable while moving multi-tenant filters to PostgreSQL-safe query patterns.

## Environment Variables
See `.env.example`:
- `PORT`: backend port
- `DB_PATH`: SQLite file path
- `FRONTEND_ORIGIN`: CORS origin
- `JWT_ACCESS_SECRET`: secret for access token signing
- `JWT_REFRESH_SECRET`: secret for refresh token signing
- `JWT_ACCESS_EXPIRES_IN`: access token TTL (default `15m`)
- `JWT_REFRESH_EXPIRES_IN`: refresh token TTL (default `7d`)
- `JWT_ISSUER`: JWT issuer claim
- `JWT_AUDIENCE`: JWT audience claim
- `BCRYPT_SALT_ROUNDS`: password hash cost
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`: reset token lifetime in minutes (default `30`)
- `EXPOSE_RESET_TOKEN`: when `true`, forgot-password response includes dev reset link/token (default true in non-production)

## Documentation Checklist
When shipping code changes, update docs in the same PR:
- `README.md`:
  - Update API routes/auth requirements if endpoints or guards change.
  - Update scripts/commands if workspace scripts or test commands change.
  - Update env var list when config keys are added/removed/renamed.
  - Update feature/performance notes when UX, lazy-loading, or bundling strategy changes.
- `docs/ARCHITECTURE.md`:
  - Keep folder structure in sync with new modules/pages/components/tests.
  - Keep schema/migration section aligned with files in `backend/migrations/`.
  - Keep API contract and assumptions aligned with current auth/isolation behavior.
  - Keep implementation phase status aligned with actual completed work.
- `docs/AUTH_ISOLATION_PLAN.md`:
  - Mark completed phases/steps when implemented.
  - Add new hardening/testing tasks when security scope changes.
- Verify docs examples by running:
  - `npm run test -w backend`
  - `npm run test -w frontend`
  - `npm run build -w frontend`

## Notes
- Seeded default user credentials:
  `email=learner@example.com`, `password=changeme123`
- Change seeded credentials for non-local environments.
- Lesson metadata is manually represented by lesson number due Educative API constraints.
- In production, set `EXPOSE_RESET_TOKEN=false` and wire forgot-password to a real email provider.
