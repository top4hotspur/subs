# Subs First Backend Milestone Plan

## 1) Scope of first backend milestone

### In scope
- Persist setup requests to a real database.
- Persist selected demo draft snapshot/context alongside setup request.
- Add a basic platform admin view for persisted setup requests.
- Keep current localStorage setup/demo flows working during migration.
- Keep customer-facing setup submission public.

### Out of scope
- Full persistence for services/staff/rota/availability/calendar/customer requests.
- Payments, messaging providers, domain automation.
- Full tenant business-owner portal migration.

---

## 2) Proposed package choices (recommendation only, do not install yet)

### ORM/query layer
- **Recommendation: Prisma**
- Why: quickest path for relational modeling, migrations, and Codex-safe incremental updates; strong TS DX for CRUD-heavy setup workflow.

Alternative:
- Drizzle is also viable and lightweight, but Prisma is faster for this milestone's schema + admin listing workflows.

### Postgres driver/runtime
- Use Prisma's Postgres support (driver handled by Prisma runtime).
- If managed serverless Postgres requires pooling, plan for provider-specific pooled `DATABASE_URL`.

### Auth package (later in milestone sequence)
- **Recommendation: Auth.js / NextAuth** (`next-auth`)
- Not required to wire fully on day 1 of this milestone; can protect platform admin view once DB flow is stable.

### Validation
- **Recommendation: Zod**
- Use for setup request payload validation in server boundary/repository input parsing.

---

## 3) Environment variables (future)

No secrets committed. Planned vars:
- `DATABASE_URL`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET` depending on chosen auth setup)
- `NEXTAUTH_URL` (if NextAuth naming used)
- `PLATFORM_ADMIN_EMAIL_ALLOWLIST` (comma-separated allowlist for initial admin gating)
- Optional dev flags:
  - `USE_LOCAL_SETUP_FALLBACK=true|false`
  - `DB_LOG_QUERIES=true|false`

---

## 4) Database schema v1 (initial)

## Table: `tenant_sites`
Purpose: future tenant container created from approved setup requests.

Fields:
- `id` (uuid, pk)
- `slug` (text, unique)
- `industry_slug` (text, indexed)
- `business_name` (text)
- `status` (text) // e.g. `ONBOARDING`, `ACTIVE`, `PAUSED`
- `created_at` (timestamp)
- `updated_at` (timestamp)

Indexes:
- unique(`slug`)
- index(`industry_slug`)
- index(`status`)

Relationships:
- one-to-many setup requests (optional once linked)

Tenant scoping:
- top-level tenant entity

---

## Table: `demo_draft_snapshots`
Purpose: immutable or versioned snapshot of selected demo draft at setup submission.

Fields:
- `id` (uuid, pk)
- `industry_slug` (text, indexed)
- `template_slug` (text, indexed)
- `draft_name` (text)
- `snapshot_json` (jsonb) // safe subset of customisation data
- `source` (text) // `LOCAL_BROWSER_MOCK` initially
- `created_at` (timestamp)

Indexes:
- index(`industry_slug`)
- index(`template_slug`)
- index(`created_at`)

Relationships:
- one-to-many from setup requests via `demo_draft_snapshot_id`

Tenant scoping:
- pre-tenant onboarding artifact; not tenant-owned yet until linked to tenant/site

---

## Table: `setup_requests`
Purpose: persisted onboarding/setup pipeline.

Fields:
- `id` (uuid, pk)
- `public_reference` (text, unique) // short share-safe reference if needed
- `tenant_site_id` (uuid, nullable, fk -> tenant_sites.id)
- `industry_slug` (text, indexed)
- `template_slug` (text)
- `business_name` (text)
- `domain_option` (text)
- `existing_domain` (text, nullable)
- `desired_domain` (text, nullable)
- `domain_suggestions_text` (text, nullable)
- `communication_option` (text)
- `setup_total_gbp` (integer)
- `monthly_total_gbp` (integer)
- `status` (text, indexed)
- `contact_name` (text, nullable)
- `contact_email` (text, nullable, indexed)
- `contact_phone` (text, nullable)
- `notes` (text, nullable)
- `demo_draft_snapshot_id` (uuid, nullable, fk -> demo_draft_snapshots.id)
- `submitted_from` (text) // `WEB_PUBLIC_SETUP_FORM`
- `created_at` (timestamp)
- `updated_at` (timestamp)

Indexes:
- unique(`public_reference`)
- index(`status`, `created_at` desc)
- index(`industry_slug`, `created_at` desc)
- index(`contact_email`)

Relationships:
- optional belongs-to tenant site
- optional belongs-to demo draft snapshot
- one-to-many setup request events

Tenant scoping:
- pre-tenant onboarding; tenant scoping applies once `tenant_site_id` is assigned

---

## Table: `setup_request_events` (recommended)
Purpose: simple audit trail/status transitions.

Fields:
- `id` (uuid, pk)
- `setup_request_id` (uuid, fk -> setup_requests.id, indexed)
- `event_type` (text) // `CREATED`, `STATUS_CHANGED`, `NOTE_ADDED`, `LINKED_TENANT`
- `from_status` (text, nullable)
- `to_status` (text, nullable)
- `actor_type` (text) // `PUBLIC`, `PLATFORM_ADMIN`, `SYSTEM`
- `actor_ref` (text, nullable) // email/user id placeholder
- `event_payload_json` (jsonb, nullable)
- `created_at` (timestamp)

Indexes:
- index(`setup_request_id`, `created_at`)
- index(`event_type`)

---

## Table: `platform_admin_users` (optional placeholder)
Purpose: early allowlist/bootstrap before full RBAC.

Fields:
- `id` (uuid, pk)
- `email` (text, unique)
- `display_name` (text, nullable)
- `active` (boolean)
- `created_at` (timestamp)

Can be replaced later by full `users` + `user_site_roles` model.

---

## LocalStorage migration field mapping (high level)
- `subs-setup-requests` -> `setup_requests`
- `subs-active-demo-draft:<industry>` + `subs-demo-draft:<id>` snapshot -> `demo_draft_snapshots`
- local setup status history (implicit) -> `setup_request_events`

---

## 5) API/server actions plan

Recommended pattern:
- Route handlers for explicit setup submission + admin reads.
- Repository/service layer for DB operations and tenant/status guardrails.
- Optional server actions for same-origin UI mutations later.

Planned operations:
1. `createSetupRequest(input, demoDraftSnapshot?)`
2. `listSetupRequests(filters)` (platform admin)
3. `getSetupRequestById(idOrPublicReference)`
4. `updateSetupRequestStatus(id, nextStatus)` (platform admin)
5. `attachDemoDraftSnapshot(setupRequestId, snapshot)`
6. Later: `createTenantSiteFromSetupRequest(setupRequestId)`

---

## 6) Auth plan for milestone 1

Minimal auth recommendation:
- Protect **platform admin persisted queue view** first.
- Keep public setup submission endpoint/page open (rate-limited/captcha later if needed).

Phase approach:
1. No business owner auth required for first persistence cut.
2. Platform admin guard via allowlisted email + Auth.js session once auth is wired.
3. Keep `/setup/[industry]` public and unchanged from customer perspective.

---

## 7) Migration strategy from localStorage

Current:
- Setup form writes to localStorage only.

Milestone behavior:
1. Setup form attempts backend persist first.
2. On success, still optionally mirror to localStorage (short-term continuity).
3. On backend failure, fallback to localStorage with clear UX note (temporary).
4. Confirmation page load order:
   - backend by `requestId` (or `publicReference`)
   - fallback localStorage if backend not found/unavailable
5. Existing `/account` and `/admin` local mock sections can remain during transition.

---

## 8) Planned UI/code touchpoints (later implementation)

Likely files:
- `src/components/setup/setup-request-form.tsx`
- `src/app/setup/confirmation/page.tsx`
- `src/app/admin/page.tsx` (or new platform admin route)
- `src/lib/setup/local-setup-requests.ts` (fallback/bridge mode)
- new repo/db files, e.g.:
  - `src/lib/db/client.ts`
  - `src/lib/setup/setup-request-repository.ts`
  - `src/lib/setup/setup-request-schema.ts`

---

## 9) Validation gates for every implementation task

Required each task:
- `npm run lint`
- `npm run build`

When Prisma/migrations are added later:
- generate client
- run migration
- verify migration in clean environment

---

## 10) Suggested task breakdown (Codex-safe slices)

Task 1: Dependency + DB foundation (no feature wiring)
- Add Prisma + DB client scaffold + baseline schema models only.

Task 2: Repository + validation layer
- Add Zod input schemas and repository CRUD for setup request + demo snapshot.

Task 3: Backend create/read operations
- Add setup-request create + read boundary (route handler or action wrapper).

Task 4: Setup form backend submit with local fallback
- Update setup form to submit to backend first, fallback to local.

Task 5: Confirmation backend read + fallback
- Confirmation page attempts backend fetch, then local fallback.

Task 6: Platform admin persisted setup queue
- Add protected admin view for persisted setup request listing/status updates.

Task 7: Docs + smoke test updates
- Update hosted smoke test + migration notes.

---

## 11) Risks and rollback

### Risks
1. DB connection issues on hosted/serverless runtime.
2. Connection pooling limits under serverless bursts.
3. Auth gating accidentally blocking public setup flow.
4. Tenant leakage if repository guards are weak.
5. Partial migration causing split-brain between DB and localStorage.

### Mitigations
- Keep local fallback during initial rollout.
- Add strict repository contracts requiring scope/status checks.
- Start with admin-only protected read paths.
- Log setup request create failures with correlation id.

### Rollback strategy
- Feature flag backend setup persistence.
- If disabled, revert to local-only submission path without UI break.

---

## 12) Recommended execution order
1. Schema + repository + create operation
2. Setup form submit integration with fallback
3. Confirmation backend lookup
4. Admin persisted queue
5. Auth hardening on admin route

This sequence delivers real value early while minimizing migration risk.

## Task 1 implementation status
- Added foundation packages (no runtime wiring yet):
  - `prisma` (dev dependency)
  - `@prisma/client`
  - `zod`
- Added initial Prisma schema at `prisma/schema.prisma` using PostgreSQL provider and `DATABASE_URL` env reference.
- Added Prisma client singleton helper at `src/lib/db/prisma.ts`.
- Added setup persistence validation schemas at `src/lib/setup/setup-request-schema.ts`.
- Added `.env.example` placeholder for `DATABASE_URL` and future auth envs.
- No setup form, API route, or auth wiring has been implemented in Task 1.

## Task 2 implementation status
- Added repository module: `src/lib/setup/setup-request-repository.ts`.
- Added repository operations:
  - `createSetupRequest`
  - `getSetupRequestById`
  - `listSetupRequests`
  - `updateSetupRequestStatus`
  - `createSetupRequestEvent`
  - `createDemoDraftSnapshot`
  - `attachDemoDraftSnapshotToSetupRequest`
- Expanded Zod validation schemas in `src/lib/setup/setup-request-schema.ts`:
  - `createSetupRequestSchema`
  - `updateSetupRequestStatusSchema`
  - `listSetupRequestsSchema`
  - `createDemoDraftSnapshotSchema`
  - `createSetupRequestEventSchema`
- Added inferred type exports in `src/lib/setup/setup-request-types.ts`.
- Repository validates inputs with Zod and throws clear validation errors.
- No API routes or UI wiring added in Task 2.
- No migrations or DB provisioning performed.

## Task 3 implementation status
- Added server env/config helper: `src/lib/config/server-env.ts`.
- Added route handlers:
  - `src/app/api/setup-requests/route.ts` (`POST`, `GET`)
  - `src/app/api/setup-requests/[id]/route.ts` (`GET`, `PATCH`)
- Implemented temporary admin guard for list/update using:
  - `PLATFORM_ADMIN_EMAILS`
  - `x-platform-admin-email` header
- Added backend-not-configured behavior (`503`, `BACKEND_PERSISTENCE_NOT_CONFIGURED`) when `DATABASE_URL` is absent.
- Added backend route smoke test doc: `docs/subs-backend-route-smoke-test.md`.
- No setup form/confirmation UI wiring yet.
- No auth integration yet.
- No migrations run.

## Task 4 implementation status
- Added browser backend client helper: `src/lib/setup/setup-request-backend-client.ts`.
- Setup form now attempts backend `POST /api/setup-requests` first.
- Setup form falls back to localStorage creation when backend is unavailable (`503`/network/not configured).
- Confirmation page now supports source-aware lookup using query params:
  - `source=backend`: backend first, then local fallback
  - `source=local` or missing: local first, then backend fallback
- Added mapping helpers in `src/lib/setup/setup-request-mappers.ts` for consistent display shape.
- No auth wiring added.
- No migrations run.

## Task 4 Smoke Test Status (2026-05-22)

- Prisma validate: passed against local `.env` Neon configuration.
- Prisma generate: passed.
- Migration status: `init_setup_persistence` already exists and database reported "Already in sync".
- Local API smoke test (dev server):
  - `POST /api/setup-requests`: passed (record persisted).
  - `GET /api/setup-requests/[id]`: passed.
  - `GET /api/setup-requests` with `x-platform-admin-email`: passed.
  - `PATCH /api/setup-requests/[id]` with `x-platform-admin-email`: passed (status updated to `REVIEWING`).
- Fallback behavior verification:
  - Temporary `.env` rename test caused API to return `503 BACKEND_PERSISTENCE_NOT_CONFIGURED`.
  - This confirms backend-unavailable path remains active for frontend fallback handling.
- Hosted reminder:
  - Amplify-hosted runtime still requires its own env vars (`DATABASE_URL`, `DIRECT_DATABASE_URL`, `PLATFORM_ADMIN_EMAILS`) configured in Amplify environment settings.

## Task 5 status: persisted admin setup queue

Implemented `/admin/setup-requests` as a backend-only setup queue view.

- Uses setup-request API routes (`GET /api/setup-requests`, `GET /api/setup-requests/:id`, `PATCH /api/setup-requests/:id`).
- Uses temporary `x-platform-admin-email` header from page input (saved locally for convenience only).
- Shows persisted setup request details and allows status updates.
- Does not fall back to localStorage on this page; backend errors are shown explicitly (`BACKEND_PERSISTENCE_NOT_CONFIGURED`, `FORBIDDEN`, network error).

Auth note:
- This is temporary until Auth.js role-based access is added.

## Task 6 status: persisted site provisioning model

Added persisted `TenantSite` provisioning workflow:
- New provisioning/domain/subscription placeholder models in Prisma.
- Repository/API for creating a tenant site from setup request.
- New admin page `/admin/sites` for persisted subscriber-site queue and checklist updates.
- `/admin/setup-requests` now includes **Start site setup** action.

No Auth.js or infrastructure automation added in this task.

## Migration baseline resolution (2026-05-22)

- Issue: `prisma migrate dev` was blocked in non-interactive shell; DB already had existing tables so `migrate deploy` initially failed with baseline error.
- Safe resolution used:
1. `npx prisma migrate resolve --applied 20260522122802_init_setup_persistence`
2. `npx prisma migrate deploy`
- Result:
  - provisioning migration `20260522145243_add_site_provisioning` applied successfully.
  - database schema reported up to date by `npx prisma migrate status`.

## Platform admin authentication update (Auth.js)

- Added first-pass Auth.js/NextAuth platform-admin authentication.
- Admin pages now require login via `/admin/login`.
- Credentials bootstrap uses:
  - allowlisted email (`PLATFORM_ADMIN_EMAILS`)
  - temporary access code (`PLATFORM_ADMIN_ACCESS_CODE`)
- Public setup submission remains open (`POST /api/setup-requests`).
- Admin APIs now use authenticated session checks (no header-based admin spoofing).

## Platform admin authentication (first pass)

- Admin pages now require Auth.js login at `/admin/login`.
- Credentials login uses:
  - allowlisted admin email (`PLATFORM_ADMIN_EMAILS`)
  - temporary access code (`PLATFORM_ADMIN_ACCESS_CODE`)
- This replaces manual header-based admin UI access.
- Public setup submission remains open (`POST /api/setup-requests`).
