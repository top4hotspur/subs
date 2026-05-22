# Subs Backend Route Smoke Test (Task 3)

## Scope
These smoke checks cover backend setup-request routes added in Task 3.
No UI wiring is required for these checks.

Routes:
- `POST /api/setup-requests`
- `GET /api/setup-requests`
- `GET /api/setup-requests/:id`
- `PATCH /api/setup-requests/:id`

## Prerequisites
1. `DATABASE_URL` configured in local env for runtime route execution.
2. `PLATFORM_ADMIN_EMAILS` configured for temporary admin-guarded endpoints.

If `DATABASE_URL` is missing, routes return:
- `503`
- `{ "ok": false, "error": "BACKEND_PERSISTENCE_NOT_CONFIGURED" }`

## Temporary admin guard
Until Auth.js is added, admin routes use a temporary header:
- `x-platform-admin-email`

Header value must match one of `PLATFORM_ADMIN_EMAILS`.

Guarded endpoints:
- `GET /api/setup-requests`
- `PATCH /api/setup-requests/:id`

## PowerShell examples

### Create setup request
```powershell
$body = @{
  industrySlug = "barbers"
  businessName = "Northside Barber Co."
  contactName = "Alex Owner"
  contactEmail = "alex@example.com"
  contactPhone = "07123456789"
  domainOption = "EXISTING_DOMAIN"
  existingDomain = "northsidebarber.co.uk"
  communicationOption = "EMAIL_ONLY"
  setupTotalGbp = 149
  monthlyTotalGbp = 30
  status = "SETUP_REVIEW_REQUESTED"
  notes = "Created from smoke test"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/setup-requests" -ContentType "application/json" -Body $body
```

### List setup requests (admin guarded)
```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/setup-requests" -Headers @{ "x-platform-admin-email" = "admin@example.com" }
```

### Read one setup request by id
```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/setup-requests/<SETUP_REQUEST_ID>"
```

### Update setup request status (admin guarded)
```powershell
$patch = @{
  status = "PAYMENT_PENDING"
  message = "Status moved during smoke test"
} | ConvertTo-Json

Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/setup-requests/<SETUP_REQUEST_ID>" -ContentType "application/json" -Headers @{ "x-platform-admin-email" = "admin@example.com" } -Body $patch
```

## Current limitations
- No Auth.js integration yet.
- No tenant/business owner authorization model yet.
- No UI wiring yet.
- No migrations run as part of this task.

## UI-to-backend handoff checks (Task 4)
- Submit `/setup/<industry>` and verify backend-first attempt:
  - when backend is configured and reachable, confirmation URL includes `source=backend`.
  - when backend is unavailable or returns `BACKEND_PERSISTENCE_NOT_CONFIGURED`, confirmation URL includes `source=local`.
- Confirm `/setup/confirmation` loads backend request when `source=backend` and falls back to local if unavailable.
- Confirm `/setup/confirmation` empty state says: "Setup request not found in this browser or backend." when neither source can resolve.
- No auth is required yet for customer-side setup submission/read by opaque id.

## Executed Local Route Smoke Test (2026-05-22)

Result: PASS (with Neon env loaded from local `.env`).

- `POST /api/setup-requests`: created persisted record.
- `GET /api/setup-requests/:id`: returned created record.
- `GET /api/setup-requests` with `x-platform-admin-email`: returned list including created record.
- `PATCH /api/setup-requests/:id` with `x-platform-admin-email`: updated status successfully.

Fallback check:
- With `.env` temporarily removed, POST returned `503` with `BACKEND_PERSISTENCE_NOT_CONFIGURED`.
- Confirms backend-off path is still available for localStorage fallback flows.

## Amplify SSR runtime env note

For Amplify-hosted Next.js SSR/API routes, setting environment variables in the Amplify console is not always sufficient by itself for runtime visibility.  
During Amplify build, required server env vars should be written into `.env.production` so route handlers can read them at runtime:
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `PLATFORM_ADMIN_EMAILS`

## Persisted admin queue check

A dedicated backend queue page is available at `/admin/setup-requests`.

Expected behavior:
- Admin enters an allowlisted email used in `x-platform-admin-email`.
- Page loads persisted setup requests from backend API.
- Status updates call PATCH backend route.
- If backend is unavailable/misconfigured, page shows explicit error and does not use localStorage fallback.

## Persisted site provisioning routes (temporary admin guard)

Added backend admin provisioning routes:
- `GET /api/admin/sites`
- `POST /api/admin/sites` (create from setupRequestId)
- `GET /api/admin/sites/:id`
- `PATCH /api/admin/sites/:id`
- `PATCH /api/admin/sites/:id/tasks/:taskId`

Guard:
- `x-platform-admin-email` must match `PLATFORM_ADMIN_EMAILS`.
- Temporary until Auth.js.

## Executed provisioning API smoke test (2026-05-22)

Result: PASS

- `GET /api/admin/sites` returned persisted site list.
- `POST /api/admin/sites` with `setupRequestId` created a tenant site (or returned existing when already linked).
- `GET /api/admin/sites/:id` returned domains, tasks, events, and subscription placeholder.
- `PATCH /api/admin/sites/:id/tasks/:taskId` updated task status (`IN_PROGRESS` verified).

Migration state resolution used before this smoke test:
- `prisma migrate resolve --applied 20260522122802_init_setup_persistence`
- `prisma migrate deploy` (applied `20260522145243_add_site_provisioning`)

## Provisioning route usage note

Operational flow now includes:
1. `POST /api/admin/sites` from `/admin/setup-requests` Start site setup action.
2. Redirect/deep-link to `/admin/sites?siteId=<id>` for immediate checklist/domain/subscription review.

No domain/DNS automation is performed; domain panel remains manual tracking only.

