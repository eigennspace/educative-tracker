# Educative Learning Progress Tracker - Architecture Plan

## 1) System Architecture Overview

### Chosen Stack
- Frontend: React + Vite + TailwindCSS + Recharts
- Backend: Node.js + Express (REST API)
- Database: SQLite (file-based) via `better-sqlite3`
- Validation: Zod
- Process orchestration: npm workspaces + concurrently

### Why this architecture
- Local-first: SQLite file runs with zero external services.
- Fast iteration: Vite + nodemon for hot reload in both frontend and backend.
- Extensible: backend modules and SQL schema are designed for easy migration to PostgreSQL.
- Clean boundaries: frontend only talks to REST API; SQL access stays in backend service modules.

### High-level flow
1. User interacts with React UI.
2. UI calls Express REST endpoints (`/api/*`).
3. Backend service layer executes SQL against SQLite.
4. API returns DTOs optimized for dashboard and analytics.

### Frontend runtime architecture
- Route-level lazy loading via `React.lazy` + `Suspense` in `frontend/src/App.jsx`.
- Dashboard chart component lazily loaded from `frontend/src/features/dashboard/WeeklyTrendChart.jsx`.
- Vite chunk strategy isolates `recharts` into a dedicated bundle via `manualChunks` in `frontend/vite.config.js`.

## 2) Folder Structure

```txt
educative-tracker/
  backend/
    migrations/
      001_init.sql
      002_seed.sql
      003_auth.sql
      004_backfill_default_user_password.sql
      005_password_reset_tokens.sql
    src/
      config/
        env.js
      db/
        index.js
        migrate.js
        seed.js
      middleware/
        auth.js
        errorHandler.js
      modules/
        auth/
          auth.controller.js
          auth.routes.js
          auth.service.js
        courses/
          courses.controller.js
          courses.routes.js
          courses.service.js
        progress/
          progress.controller.js
          progress.routes.js
          progress.service.js
        sessions/
          sessions.controller.js
          sessions.routes.js
          sessions.service.js
        dashboard/
          dashboard.controller.js
          dashboard.routes.js
          dashboard.service.js
        analytics/
          analytics.controller.js
          analytics.routes.js
          analytics.service.js
      types/
        api.js
      utils/
        date.js
      app.js
      server.js
    test/
      integration/
        isolation.test.js
        password-reset.test.js
    package.json
  frontend/
    src/
      api/
        client.js
      auth/
        AuthContext.jsx
      components/
        ChartCard.jsx
        ConfirmModal.jsx
        Header.jsx
        ProgressBar.jsx
        RequireAuth.jsx
        StatCard.jsx
      features/
        courses/
          CourseForm.jsx
          CoursesTable.jsx
        dashboard/
          Heatmap.jsx
          WeeklyTrendChart.jsx
        sessions/
          SessionForm.jsx
          SessionsTable.jsx
      hooks/
        useFetch.js
      layouts/
        AppLayout.jsx
      pages/
        CoursesPage.jsx
        DashboardPage.jsx
        ForgotPasswordPage.jsx
        LoginPage.jsx
        NotFoundPage.jsx
        RegisterPage.jsx
        ResetPasswordPage.jsx
        SessionsPage.jsx
      styles/
        globals.css
      test/
        auth.integration.test.jsx
        setup.js
      App.jsx
      main.jsx
    vite.config.js
    package.json
  docs/
    ARCHITECTURE.md
    AUTH_ISOLATION_PLAN.md
  scripts/
    docker.sh
  docker-compose.yml
  docker-compose.prod.yml
  .env.example
  package.json
  README.md
  CHANGELOG.md
  SPEC.md
```

Docker-specific project files:
- `backend/Dockerfile`
- `backend/.dockerignore`
- `frontend/Dockerfile`
- `frontend/.dockerignore`
- `frontend/nginx.conf`

## 3) Database Schema (PostgreSQL-compatible design)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  category TEXT NOT NULL,
  total_lessons INTEGER NOT NULL CHECK(total_lessons >= 0),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours REAL NOT NULL CHECK(estimated_hours >= 0),
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  lesson_number INTEGER NOT NULL CHECK(lesson_number > 0),
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(course_id, lesson_number),
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  session_date TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_courses_user ON courses(user_id);
CREATE INDEX idx_progress_course ON lesson_progress(course_id);
CREATE INDEX idx_sessions_user_date ON study_sessions(user_id, session_date);
CREATE INDEX idx_sessions_course ON study_sessions(course_id);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE UNIQUE INDEX idx_users_email_unique ON users(email) WHERE email IS NOT NULL;
```

## 4) API Contract (REST)

Base URL: `/api`

### Health
- `GET /health` -> service status

### Auth (public)
- `POST /auth/register` -> create user + issue access/refresh tokens
- `POST /auth/login` -> authenticate user + issue access/refresh tokens
- `POST /auth/refresh` -> rotate/issue new access + refresh tokens
- `POST /auth/forgot-password` -> issue password reset token flow (generic response)
- `POST /auth/reset-password` -> validate reset token and update password

### Auth Requirement
- All endpoints below require `Authorization: Bearer <access_token>`.

### Courses
- `GET /courses` -> list courses with computed progress, last studied, hours
- `POST /courses` -> create course
- `GET /courses/:id` -> course detail
- `PATCH /courses/:id` -> update course
- `DELETE /courses/:id` -> delete course

### Lesson Progress
- `GET /courses/:id/progress` -> progress list for course
- `POST /courses/:id/progress/toggle` -> mark lesson completed/uncompleted
  - body: `{ lessonNumber: number, completed: boolean, applyToPrevious?: boolean }`
  - `applyToPrevious` only affects complete action; when true, marks lessons `1..lessonNumber` as complete

### Study Sessions
- `GET /sessions` -> list sessions (optional `courseId`, `from`, `to` filters)
- `POST /sessions` -> create session
- `PATCH /sessions/:id` -> update session
- `DELETE /sessions/:id` -> delete session

### Dashboard
- `GET /dashboard/summary` -> active courses, total hours, streak, completion snapshot
- `GET /dashboard/weekly` -> last 12 weeks study minutes + sessions count

### Analytics
- `GET /analytics/heatmap?year=YYYY` -> daily totals for GitHub-style heatmap
- `GET /analytics/insights` -> productivity insights (best day, consistency, trend)

## 5) Implementation Status

### Phase 1: Database + API
Status: Implemented.

- Migrations and seed scripts completed.
- Modules implemented for courses/progress/sessions/dashboard/analytics.
- Auth module implemented with JWT access + refresh tokens.
- Password reset flow implemented with one-time hashed reset tokens.
- Error handling and input validation integrated.

### Phase 2: Frontend Core UI
Status: Implemented.

- App router and protected route flow implemented.
- Auth pages implemented: login/register/forgot/reset password.
- Core pages implemented: dashboard/courses/sessions.
- CRUD forms and tables implemented.

### Phase 3: Tenant Isolation and Security Tests
Status: Implemented.

- Protected APIs require Bearer token.
- Service-layer user scoping enforced across modules.
- Integration tests validate cross-user isolation across:
  - courses
  - progress
  - sessions
  - dashboard
  - analytics

### Phase 4: UX + Accessibility
Status: Implemented.

- Responsive header and mobile card views for courses/sessions.
- Confirmation modal includes focus trap, initial focus, escape support, and focus restore.
- Form UX improved with inline validation/help text and clearer error states.
- Progress and heatmap visuals include stronger accessible semantics and text summaries.

### Phase 5: Frontend Performance
Status: Implemented.

- Route-level lazy loading for all pages.
- Dashboard chart code split with nested `Suspense` boundary.
- Dedicated `recharts` bundle created via Vite `manualChunks`.

## 6) Assumptions
- JWT auth is required for all protected API routes.
- Seeded default user is for local development bootstrap only.
- Lesson completion is tracked by lesson number instead of full lesson metadata (manual input constraint).
- Timezone uses local system date for streak and session grouping.
- In production, reset tokens should be delivered by real email provider and `EXPOSE_RESET_TOKEN` should be disabled.
