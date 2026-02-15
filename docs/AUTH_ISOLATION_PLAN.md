# Auth and User Isolation Plan

## Current State (implemented now)

- JWT auth middleware now sets `req.userId` from Bearer access tokens.
- All module controllers pass `req.userId` to service layer.
- Progress endpoints enforce course ownership (`course.id` + `user_id`) before reads/writes.
- Analytics endpoints no longer hardcode user id.

## Phase 1: Real Authentication

Status: Implemented.

1. Added credential-based login (`POST /api/auth/login`) and registration (`POST /api/auth/register`).
2. Added refresh flow (`POST /api/auth/refresh`) returning rotated access + refresh tokens.
3. Added password hashing with `bcryptjs` and unique email index in `users` table.
4. Replaced header-based user fallback with Bearer JWT auth middleware for protected routes.

## Phase 2: Strong Tenant Isolation

Status: Implemented.

1. Require authenticated user for all `/api/*` (except health/auth endpoints).
2. Added integration tests for cross-user access attempts on every resource:
   - courses
   - sessions
   - progress
   - dashboard
   - analytics
3. Reject access when resource owner does not match `req.userId` with 404/403 policy.

## Password Recovery

Status: Implemented (dev-email simulation mode).

1. Added `POST /api/auth/forgot-password` with generic response to reduce account enumeration risk.
2. Added one-time hashed reset tokens with expiry in `password_reset_tokens`.
3. Added `POST /api/auth/reset-password` to update password and invalidate outstanding reset tokens.
4. Frontend pages implemented:
   - `/forgot-password`
   - `/reset-password`

## Phase 3: Token and Session Hardening

1. Rotate refresh tokens and persist token family metadata (revocation support).
2. Add logout endpoint that revokes refresh token.
3. Add rate limiting and lockout policy for auth endpoints.
4. Add CORS and cookie settings for production domains.

## Phase 4: Operational Security

1. Add audit logging for auth and authorization failures.
2. Add structured security events (login success/failure, token refresh, unauthorized attempts).
3. Add secret rotation policy for JWT keys.
4. Add periodic dependency and vulnerability scanning in CI.
