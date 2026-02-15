# Changelog

All notable changes to this project should be documented in this file.

The format is based on Keep a Changelog and follows semantic versioning where practical.

## [Unreleased]

### Added
- Docker production override file (`docker-compose.prod.yml`) with stricter defaults.

### Changed
- Docker helper script and npm scripts now include production-override commands.
- README and architecture docs updated for Docker production behavior.
- Login page layout now centers the auth card vertically with a branded header block above the form (`ET` + `Educative Tracker`).

### Fixed
- Clarified deployment URLs to avoid implying backend host exposure in production override mode.

### Docs
- Added docs alignment note for `SPEC.md` as historical scope brief.

## [1.0.0] - 2026-02-15

### Added
- JWT authentication with access/refresh token flows (`register`, `login`, `refresh`).
- Strong user isolation across courses, sessions, progress, dashboard, and analytics.
- Forgot/reset password flow with one-time hashed reset tokens.
- Lesson progress range-complete option (`applyToPrevious`) for marking lessons `1..N`.

### Changed
- Frontend UX refresh with responsive header and mobile card layouts for courses/sessions.
- Accessibility-first upgrades (focus-managed confirmation modal, improved form semantics, ARIA progress/heatmap improvements).
- Frontend performance optimization with route-level lazy loading and chart bundle isolation.

### Fixed
- Cross-user access isolation coverage via backend integration tests.
- Frontend auth integration coverage for login/register and forgot/reset flows.

### Docs
- Synced `README.md`, `docs/ARCHITECTURE.md`, and `docs/AUTH_ISOLATION_PLAN.md` with current implementation.
- Added documentation checklist to keep docs updated with code changes.
