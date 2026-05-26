# Subs Backend Route Smoke Test

## Scope
These smoke checks cover setup-request and provisioning backend routes.

## Prerequisites
1. `DATABASE_URL` configured.
2. `DIRECT_DATABASE_URL` configured.
3. Platform admin auth env vars configured:
   - `PLATFORM_ADMIN_EMAILS`
   - `PLATFORM_ADMIN_ACCESS_CODE`
   - `AUTH_SECRET`/`NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

If `DATABASE_URL` is missing, backend routes return:
- `503`
- `{ "ok": false, "error": "BACKEND_PERSISTENCE_NOT_CONFIGURED" }`

## Auth model for admin routes (current)
- Admin APIs require authenticated platform-admin session (Auth.js).
- Header-based `x-platform-admin-email` is no longer used for normal admin access.

Public routes kept open:
- `POST /api/setup-requests`
- `GET /api/setup-requests/:id` (opaque id, future hardening planned)

## Route set
- `POST /api/setup-requests`
- `GET /api/setup-requests`
- `GET /api/setup-requests/:id`
- `PATCH /api/setup-requests/:id`
- `GET /api/admin/sites`
- `POST /api/admin/sites`
- `GET /api/admin/sites/:id`
- `PATCH /api/admin/sites/:id`
- `PATCH /api/admin/sites/:id/tasks/:taskId`

## Hosted auth smoke checks
1. Open `/admin` while logged out and confirm redirect to `/admin/login`.
2. Sign in with allowlisted admin email + access code.
3. Confirm `/admin` loads after login.
4. Confirm `/admin/setup-requests` loads without manual header.
5. Confirm `/admin/sites` loads without manual header.
6. Logout and confirm `/admin` redirects to `/admin/login`.
7. Confirm public `/setup/barbers` still works without login.
8. If login fails, confirm `/admin/login` shows a visible error message.
9. Call `GET /api/admin-auth-health` and confirm env/auth readiness booleans are present.

## Hosted persisted queue checks
- `/admin/setup-requests` loads persisted records.
- Setup request status update persists.
- `/admin/sites` list/detail/tasks load and update.

## Amplify SSR runtime env note
For Amplify-hosted Next.js SSR/API routes, write required env vars into `.env.production` during build:
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `PLATFORM_ADMIN_EMAILS`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `PLATFORM_ADMIN_ACCESS_CODE`

No real secrets should be committed in repo files.

## Auth diagnostics route

- Route: `GET /api/admin-auth-health`
- Purpose: safe hosted diagnostics for auth environment readiness.
- Returns booleans/count/host metadata only; no secret values are returned.

## Setup request confirmation token checks
1. Submit `POST /api/setup-requests` and confirm response includes:
   - `setupRequest.id`
   - `confirmationToken`
   - `confirmationUrl`
2. Open `confirmationUrl` and verify setup request loads.
3. Request `GET /api/setup-requests/{id}` without token as public user and verify denied/not-found response.
4. Request `GET /api/setup-requests/{id}?token=invalid` and verify denied/not-found response.
5. Request `GET /api/setup-requests/{id}?token={valid}` and verify success.
6. Verify platform admin can still read setup request detail through admin UI.
