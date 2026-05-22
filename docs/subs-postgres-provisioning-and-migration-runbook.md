# Subs Postgres Provisioning and Migration Runbook

## Purpose
This runbook defines a practical, low-risk path to enable real setup request persistence for Subs.

Scope for this runbook:
- provisioning/migration planning only
- no infra creation by code
- no migrations executed in this step
- no runtime behavior changes in this step

---

## 1) Recommended Postgres provider for v1

## Compared options

### AWS RDS PostgreSQL
Pros:
- fully AWS-native
- strong production posture
- mature backup/restore and operations model

Cons:
- slower setup than serverless Postgres platforms
- more operational overhead (networking, sizing, tuning)
- can be relatively expensive at very low traffic if always-on

Fit for current stage:
- good long-term option, less ideal for fastest low-ops v1

### AWS Aurora Serverless v2 (PostgreSQL)
Pros:
- AWS-native, scalable
- strong future production path

Cons:
- more complexity than needed for first milestone
- still requires stronger infra/ops decisions early
- typically slower to get to first useful result vs managed serverless Postgres specialists

Fit for current stage:
- strong later-stage target, not the fastest v1 path

### Neon serverless Postgres
Pros:
- very fast setup
- low-cost friendly for low traffic
- connection pooling story suitable for serverless request patterns
- Prisma-friendly
- good developer experience for branch/preview workflows

Cons:
- external (non-AWS-native) provider
- requires deliberate plan if moving later to AWS-native DB

Fit for current stage:
- excellent speed/cost/complexity balance for v1

### Supabase Postgres
Pros:
- fast setup
- Prisma-compatible Postgres
- good tooling and dashboard experience

Cons:
- some teams may be tempted into broader Supabase features early (scope creep)
- still external provider if AWS-native later is desired

Fit for current stage:
- also strong for v1, slightly less focused than Neon if only DB is needed

## v1 recommendation
Use **Neon serverless Postgres** for v1 setup-request persistence.

Reason:
- fastest path to working backend persistence
- low operational overhead and low early cost
- good fit for Amplify-hosted Next.js route handlers
- pooled connection model aligns with serverless usage
- easy Prisma adoption

Re-evaluate later whether to remain on Neon or migrate to AWS-native Postgres when scale/compliance/ops requirements justify it.

---

## 2) Connection pooling and serverless considerations

Serverless/SSR route handlers can create connection pressure because:
- many short-lived concurrent invocations can open many DB sessions
- direct connections can exhaust connection limits quickly
- cold start bursts can spike connection count

Guidance:
- use **pooled runtime connection URL** for app queries (`DATABASE_URL`)
- use **direct/non-pooled URL** for migrations (`DIRECT_DATABASE_URL`) when provider supports this split

Prisma pattern:
- runtime Prisma client reads `DATABASE_URL`
- migration commands can use `DIRECT_DATABASE_URL` when configured

Why split helps:
- pooled URL protects runtime under concurrency
- direct URL avoids migration edge cases with pool/proxy behavior

---

## 3) Environment variables needed

Planned variables:
- `DATABASE_URL`
- `DIRECT_DATABASE_URL` (recommended when provider gives direct endpoint)
- `PLATFORM_ADMIN_EMAILS`
- future: `AUTH_SECRET` or `NEXTAUTH_SECRET`
- future: `NEXTAUTH_URL` (or `AUTH_URL` depending on final auth setup)

Usage:
- `DATABASE_URL`: runtime route handlers + Prisma client
- `DIRECT_DATABASE_URL`: migration/deploy commands
- `PLATFORM_ADMIN_EMAILS`: temporary admin route guard
- auth vars: future auth milestone only

Amplify configuration:
- set these in Amplify environment variables (per branch/environment)
- never hardcode secrets in source
- never commit real connection strings

---

## 4) Amplify hosting considerations

For Amplify-hosted SSR Next.js:
- env vars must be configured in Amplify app/branch environment settings
- ensure server-side runtime has access (not just client build-time vars)
- API route behavior check is the easiest verification:
  - before DB config: `/api/setup-requests` returns `BACKEND_PERSISTENCE_NOT_CONFIGURED` (`503`)
  - after DB config: route should proceed to validation/auth logic instead of 503

Runtime visibility checks:
- call guarded list route with admin header
- call POST route with valid payload
- confirm route no longer returns persistence-not-configured error

---

## 5) Prisma migration plan

Local development commands (when DB is available):
```bash
npx prisma migrate dev --name init_setup_persistence
npx prisma generate
npx prisma validate
```

Production/deployment migration command:
```bash
npx prisma migrate deploy
```

When to use what:
- `migrate dev`: local development schema evolution + migration file generation
- `migrate deploy`: apply committed migrations in deployed environments
- avoid `db push` for production schema history (no durable migration trail)

Migration files:
- commit migration files to source control
- review migration SQL before deploy

---

## 6) Amplify build command recommendation (phased)

Current principle: avoid breaking builds before DB/env are ready.

Phase A (now, safest):
- keep build stable
- optionally add `npx prisma generate` only when dependency and environment behavior are verified
- do **not** add `migrate deploy` yet

Phase B (after DB + env readiness):
- add controlled migration execution strategy
- either:
  - run `npx prisma migrate deploy` in build, or
  - run migrations in a separate CI/release step (often safer)

Phase C (later maturity):
- decide long-term migration ownership (build vs dedicated release pipeline)
- enforce approvals for production migrations

Recommendation:
- short term: keep migrations **manual/explicit** until dev/staging DB and envs are proven stable
- then adopt scripted deploy flow intentionally

---

## 7) First real DB smoke test (after provisioning)

## Expected behavior change
- Before DB config: `503 BACKEND_PERSISTENCE_NOT_CONFIGURED`
- After DB config: route should return normal success/validation/guard responses

## PowerShell smoke examples

### 1) Admin list route no longer 503
```powershell
Invoke-RestMethod -Method GET -Uri "https://<host>/api/setup-requests" -Headers @{ "x-platform-admin-email" = "admin@example.com" }
```

### 2) Submit setup form in UI
- open `/setup/barbers`
- submit valid setup request
- expected redirect includes `source=backend`
- confirmation banner shows `Saved to backend`

### 3) Read setup request by id
```powershell
Invoke-RestMethod -Method GET -Uri "https://<host>/api/setup-requests/<SETUP_REQUEST_ID>"
```

### 4) Direct POST smoke
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
  notes = "DB smoke test"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "https://<host>/api/setup-requests" -ContentType "application/json" -Body $body
```

---

## 8) Rollback plan

If DB connectivity breaks:
1. remove or disable `DATABASE_URL` in Amplify env
2. backend routes return 503 persistence-not-configured
3. setup form should continue via localStorage fallback
4. confirmation continues local lookup path

Result:
- public demo/setup flow remains usable as local/mock
- persistence gracefully degrades instead of full failure

---

## 9) Security and data protection

- keep `DATABASE_URL` and direct DB URL secret
- never commit real secrets to repository
- setup requests contain personal data (contact fields)
- enforce least-privilege DB access and scoped credentials
- tenant isolation remains mandatory in all future query paths
- prepare GDPR/privacy handling for retention, deletion, and data export in later milestones
- ensure backup/restore policy exists before production usage

---

## 10) Recommended sequence after this runbook

1. Choose DB provider (recommended: Neon) and create dev/staging DB manually.
2. Set env vars locally and in Amplify (`DATABASE_URL`, `DIRECT_DATABASE_URL`, `PLATFORM_ADMIN_EMAILS`).
3. Create first Prisma migration locally.
4. Apply migration to dev DB.
5. Add/verify `prisma generate` handling in build if needed.
6. Smoke test API routes.
7. Smoke test setup form backend submit + fallback behavior.
8. Then implement Auth.js/admin protection hardening.

---

## Notes
This runbook intentionally avoids provisioning or migration execution. It is a safe operational plan for the next implementation step.

## Local Smoke Test Record (2026-05-22)

- With `.env` present, setup request routes were exercised successfully:
  - POST create
  - GET by id
  - admin GET list
  - admin PATCH status
- With `.env` temporarily removed, POST returned `503 BACKEND_PERSISTENCE_NOT_CONFIGURED` as expected.
- `.env` was restored immediately after the fallback test.

Amplify note:
- These local results do not automatically apply to hosted environments.
- Amplify must define `DATABASE_URL`, `DIRECT_DATABASE_URL`, and `PLATFORM_ADMIN_EMAILS` for backend persistence to activate.

Additional SSR/API runtime requirement:
- In Amplify build, write these env vars into `.env.production` before `npm run build` so Next.js server routes can access them at runtime.
