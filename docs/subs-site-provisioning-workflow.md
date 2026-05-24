# Subs Site Provisioning Workflow (Persisted v1)

This workflow turns a persisted setup request into a persisted subscriber site record.

## Core v1 Architecture Decision
- v1 uses one shared platform app and one central Postgres/Neon database.
- Site-scoped records are isolated by `tenantSiteId`.
- Custom domains map to `TenantSite` records.
- The shared app resolves tenant context from domain/site and renders the correct customer-facing site.
- v1 does not use per-customer code export or per-customer databases by default.
- Per-customer isolated deployments are a later exceptional enterprise option only.

## Scope
- Persisted model + admin workflow only.
- No AWS provisioning automation in this phase.
- No payment/email/Twilio integrations in this phase.

## Target Admin Workflow: Create Subscriber Site
1. Setup request is submitted and persisted.
2. Platform admin opens `/admin/setup-requests` or `/admin/sites`.
3. Platform admin clicks `Create subscriber site` / `Start site setup`.
4. Backend creates or links `TenantSite` for the setup request.
5. Backend creates baseline records:
- `SiteDomain`
- `SubscriptionRecord` placeholder
- default provisioning checklist tasks
- provisioning timeline/status events
6. Backend copies available setup context:
- persisted demo draft/settings (when available)
- persisted services/pricing (when available)
- staff/roles/rota/settings in later milestones as those modules become persisted
7. Platform admin reviews generated DNS/domain instructions.
8. Platform admin tracks statuses to go-live.

## Target Provisioning Status Sequence
- `SETUP_REQUESTED`
- `PAYMENT_PENDING`
- `DOMAIN_DETAILS_REQUIRED`
- `DNS_INSTRUCTIONS_SENT`
- `SITE_PROVISIONING`
- `SITE_READY`
- `SITE_LIVE`

## Domain Routing Model (v1)
- Incoming request host is read.
- Host is matched against `SiteDomain.domain`.
- Matching domain resolves to `TenantSite`.
- App loads tenant-scoped site settings/services/content via `tenantSiteId`.
- App renders subscriber customer site for that tenant.
- If no domain match, app falls back to MyExperiment.club platform routes.

Notes:
- support root + `www` variants via separate domain rows/mapping strategy
- support both customer-owned domains and newly registered domains
- DNS setup is manual/semi-manual first; automation later

## Manual/Semi-manual Steps Remaining in v1
- domain purchase/registration when managed by MyExperiment.club
- customer DNS or nameserver updates
- hosting/custom-domain attachment steps where needed
- payment/subscription confirmation checks
- final content/go-live review

Important:
- database/site records should be created by workflow actions, not manually built from scratch.

## Recommended Admin Action Wording
- `Create subscriber site`
- `Start site setup`
- `Generate DNS instructions`
- `Mark site ready`
- `Mark site live`

## Persisted Scope So Far
Persisted now:
- basic site settings + branding/theme/currency
- services/pricing
- staff roles + staff members
- scheduling: rota days, break windows, business closures, staff holidays

Still local/mock in current product:
- vouchers
- page content modules
- policy content modules
- payment processor integration
- social media persistence
- bookings/customers/accounts
- media file storage

## Security Note
- Provisioning admin routes require platform-admin session.
- Subscriber business-owner auth is a later milestone.

## New milestone: persisted subscriber site preview route
- Added protected preview route: `/admin/sites/[siteId]/preview`.
- Purpose: prove a customer-facing render can be produced from persisted TenantSite data before public domain routing.
- Data source (tenant-scoped):
  - `TenantSite`
  - `CustomerSiteSettings`
  - `CustomerSiteService[]`
  - `CustomerSiteStaffRole[]`
  - `CustomerSiteStaffMember[]`
  - persisted scheduling snapshot (rota days, break windows, business closures, staff holidays)
- This route is platform-admin protected and is not public custom-domain routing.
- `/demo/[industry]` remains local/mock demo playground.

## Persisted booking flow (support/provisioning preview phase)
- Tenant-scoped booking requests can now be created for a selected subscriber site.
- Route used in this milestone:
  - `/admin/sites/[siteId]/preview/booking`
- This route is platform-admin protected and intended to prove persisted booking rendering/creation before public live routing.
- Booking APIs remain admin-protected in this phase.

## Public slug route milestone (`/sites/[siteSlug]`)
- Added public tenant route: `/sites/[siteSlug]`.
- Route resolves `TenantSite.slug` server-side and renders persisted tenant-scoped customer-site data.
- Status gating preference is `SITE_READY` and `SITE_LIVE`; relaxed provisioning statuses are temporarily allowed for staged testing.
- This route is the slug-based proof path before host/domain routing goes live.

## Public booking endpoint (slug-resolved)
- Added `POST /api/sites/[siteSlug]/bookings`.
- Server resolves tenant by slug and creates tenant-scoped booking.
- Client does not send/choose arbitrary `tenantSiteId`.
- Real payment/email/Twilio are still out of scope.

## Custom-domain tenant resolution readiness (no automation)
- Added shared resolver module: `src/lib/sites/tenant-resolver.ts`.
- Resolver supports:
  - host normalization (lowercase, strip protocol/path/port/trailing dot)
  - candidate matching for root + www variants
  - SiteDomain lookup and tenant resolution
- Current status filtering is intentionally broad for provisioning/testing (`ARCHIVED`/`REMOVED`/`DELETED` excluded).
- `/sites/[siteSlug]` remains the slug fallback/proof route until host routing is enabled.

## Diagnostic route
- Added guarded diagnostic route: `GET /api/site-resolve-debug`.
- Platform-admin session required.
- Returns safe metadata:
  - received host
  - normalized host
  - matched true/false
  - tenantSiteId/tenantSlug/domainStatus when matched
- Supports test header:
  - `x-test-site-host: example.com`
  to validate domain mapping before real custom-domain attachment.
