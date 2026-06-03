# Subs Site Portal Architecture

## v1 Deployment and Data Architecture
- One shared MyExperiment.club application serves all subscribers.
- One central Postgres/Neon database stores all subscriber data.
- Tenant isolation is implemented using `tenantSiteId` on site-scoped models.
- Custom domains map to a `TenantSite` and drive tenant resolution at request time.
- v1 does not create a full separate app/database per customer by default.

## Tenant Resolution Model
1. Request arrives with `host` header/domain.
2. Domain lookup checks `SiteDomain.domain`.
3. Matching record resolves `tenantSiteId` -> `TenantSite`.
4. Shared app loads tenant-scoped settings/services/content.
5. Customer-facing site is rendered for that tenant.
6. Unknown domains fall back to platform routes.

Domain handling notes:
- root + `www` handled by explicit mapping
- existing customer domains and newly registered domains both supported
- DNS/domain automation is phased later

## Platform Admin vs Subscriber Admin
Platform admin (MyExperiment.club):
- setup requests
- subscriber sites
- provisioning workflow
- sales/CRM operations

Subscriber business admin (tenant-owned operations):
- services/prices
- staff/roles/availability
- pages/content/policies
- vouchers/communications
- booking operations

## Current Persistence State
Persisted per `tenantSiteId`:
- site settings/branding/theme/currency
- services
- staff roles
- staff members
- scheduling: rota days, break windows, business closures, staff holidays

Still local/mock:
- vouchers
- pages/content/policy persistence for live tenant
- payment integration
- bookings/customers/accounts
- media storage

## Provisioning Workflow Entry Points
From `/admin/setup-requests` or `/admin/sites`:
- `Create subscriber site`
- `Create blank subscriber site`
- `Generate DNS instructions`
- `Mark site ready`
- `Mark site live`

Provisioning note:
- demo environments are sales/playground experiences
- live subscriber sites are provisioned clean and then completed with real business data

## Manual Steps Still Expected in v1
- domain purchase/registration where managed for customer
- DNS/nameserver updates with customer/provider
- hosting custom-domain attachment checks
- payment/subscription confirmation
- final go-live review

## Future Exception Path
Per-customer isolated deployments/databases can be considered later only for exceptional enterprise/high-isolation requirements.

## Persisted preview rendering route (platform-admin protected)
- New route: `/admin/sites/[siteId]/preview`.
- Uses persisted tenant-scoped records to render a customer-facing preview surface.
- This is an internal provisioning/support preview under platform-admin session, not public runtime routing.
- Public host/domain-based routing remains a later milestone.

## Persisted preview booking capability (internal)
- Added internal persisted booking route under admin preview context:
  - `/admin/sites/[siteId]/preview/booking`
- Customer-site public booking still relies on demo/local flows in this phase.
- Tenant-scoped persisted bookings now exist for platform-admin testing and provisioning support.

## Public tenant route and custom-domain proof
- New public route `/sites/[siteSlug]` proves shared-app tenant rendering without domain middleware.
- Rendering path is the same conceptual flow as future domain routing:
  - host/slug -> tenant lookup -> tenant-scoped query -> customer-site render
- Custom-domain runtime proof now uses middleware on non-platform hosts to rewrite internally to `/tenant-domain-runtime`.
- The runtime route resolves `SiteDomain.domain -> TenantSite` and reuses the same tenant public pages as `/sites/[siteSlug]`.
- `/sites/[siteSlug]` remains the fallback/proof route on the platform host.

## Domain setup approaches (later automation)
1. Customer keeps DNS provider and adds target records.
2. MyExperiment.club manages Route 53 zone and customer updates nameservers.

No per-customer DB or code export is required for this model.

## Host/domain resolver and route safety
- Shared app now has central host resolver logic plus a middleware rewrite proof.
- Current custom-domain flow:
  1. read request host
  2. normalize host
  3. resolve `SiteDomain.domain`
  4. resolve `TenantSite`
  5. render tenant-scoped customer site using same data model as slug route
- Root and `www` hosts are handled through resolver candidate matching.
- Supported customer-domain paths include `/`, `/booking`, `/contact`, `/policy`, `/account`, `/my-account`, `/account/login`, `/account/register`, `/booking/[token]`, `/booking/payment`, `/cookies`, `/privacy`, and `/vouchers`.
- Platform hosts (`myexperiment.club`, `www.myexperiment.club`, localhost and Amplify preview hosts) are not rewritten.
- Static assets, `/_next/*`, `/api/*` and known files are bypassed. `/api/admin` returns 404 on customer-domain hosts so platform admin APIs are not exposed there.
- DNS, SSL, Amplify custom-domain attachment and Route 53/domain automation remain manual/out-of-scope in this phase.
- Platform admin now tracks manual domain/DNS state on `SiteDomain` with setup mode, DNS status, SSL status, expected DNS target/nameservers, manual check result and go-live timestamps.
- Subscriber admin sees a read-only domain status card; only platform admin can update domain/DNS workflow state.

## Business-owner access foundation (tenant-scoped)
- Added first subscriber business-owner auth path using dedicated site-admin login:
  - `/site-admin/login`
  - `/site-admin/[siteSlug]/login`
  - `/site-admin/[siteSlug]`
- Session model is separated from platform admin:
  - `roleType=SITE_ADMIN`
  - `tenantSiteId`, `tenantSlug`, `siteAdminUserId`, `siteAdminRole`
- Middleware now enforces route separation:
  - `/admin/*` requires platform-admin session only
  - `/site-admin/*` requires site-admin session only
- Site-admin users can access only their own tenant slug/site; cross-tenant access is blocked.
- Paid-order provisioning now creates the first tenant-scoped owner/admin access record when a clean subscriber site is created.
- Access codes are hashed in `CustomerSiteAdminUser`; the one-time plaintext code is only returned to platform admin during generation/reset and sent via fail-soft transactional email.
- Staff/customer auth is not included yet.

## Site-admin API expansion
- Added tenant-scoped business-owner APIs for staff and scheduling management under `/api/site-admin/[siteSlug]/*`.
- Route authorization enforces:
  - valid site-admin session
  - slug resolves to TenantSite
  - `session.tenantSiteId` must match resolved tenant id
- Platform admin APIs remain separate under `/api/admin/*`.

## Branding media upload (tenant-scoped, v1 slice)
- Business owner site-admin now has real upload/remove controls for logo and favicon.
- Upload APIs are tenant-scoped (`/api/site-admin/[siteSlug]/branding/*`) and require matching site-admin session scope.
- Files are stored in S3-compatible object storage under tenant-scoped paths; database stores metadata only.
- Limits and file types are enforced server-side.
- This is intentionally limited to branding media only in this pass.

## Payment setup architecture scope (current)
- Payment setup is now persisted per tenant through `CustomerSiteSettings`.
- Site-admin and platform support views read/write the same tenant-scoped configuration.
- Current scope is intent/configuration only; runtime payment integrations remain out of scope.
- No payment secrets or customer card data are collected in this pass.

## Update: persisted subscriber pages + social controls
- Business owner at `/site-admin/[siteSlug]` now manages persisted page/content settings for their own tenant site.
- Public tenant routes use persisted data:
  - `/sites/[siteSlug]`
  - `/sites/[siteSlug]/about` (visible when About is enabled)
  - `/sites/[siteSlug]/contact` (always standard)
  - `/sites/[siteSlug]/policy` (visible when Policy is enabled)
- Social links are rendered from persisted `socialLinks` and shown with static icon assets from `/public/icons/social`.
- Contact page map support is link-based (`google.com/maps/search`) generated from persisted address. No Google Maps API key is used.

## Conversion-path alignment update (2026-05-26)
- Demo route intent is now explicit:
  - `/demo/[industry]` family = exploratory sales/demo experience.
  - `/demo/[industry]/admin` = feature demonstration for business-admin capabilities.
  - `/demo/[industry]/customise` = transition helper only (no primary editing workflow).
- Setup conversion path is standardized:
  - `/[industry]` -> `/demo/[industry]` -> `/setup/[industry]` -> `/setup/confirmation`.
- Public navigation no longer promotes global `/account` while customer auth remains pending.
- Subscriber site provisioning remains clean-start by default; demo exploration does not imply automatic demo-data copy into live tenant records.

## Public contact enquiries route
- Added public `POST /api/contact-enquiries` for prospect support requests.
- Added platform-admin management route `/admin/contact-enquiries`.
- Public route writes persisted enquiries only and does not expose admin data.
- Admin handling remains under platform-admin auth/session controls.
- Notification/email provider wiring is intentionally deferred.

## Transactional email provider layer (Resend)
- Added `src/lib/email/email-provider.ts` as the shared transactional send layer.
- Environment variables:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `PLATFORM_NOTIFICATION_EMAIL`
- `sendTransactionalEmail(...)` returns safe result objects and does not throw for expected provider failures.
- Email is intentionally fail-soft so critical write flows remain available even if provider/env is unavailable.

## Current transactional email triggers
- `POST /api/contact-enquiries`:
  - sends platform admin notification when configured
- `POST /api/setup-requests`:
  - sends setup confirmation to prospect contact email
  - sends platform admin setup notification
- `POST /api/sites/[siteSlug]/bookings`:
  - sends customer booking confirmation when customer email is present
- `POST /api/admin/sites/[id]/bookings`:
  - mirrors booking confirmation behavior for admin-created persisted bookings

## Out of scope (unchanged)
- No Twilio/WhatsApp integration
- No bulk marketing sends
- No unsubscribe/newsletter system
- No payment provider emails

## Recurring and block-booking (v1 foundation)
- Recurring and block-booking controls are tenant-scoped configuration under shared-app/central-DB architecture.
- No payment provider subscription engine is wired in this phase.
- Public rendering can surface service badges (Recurring available, Block bookings available) from persisted service settings.

## /admin platform boundary (2026-05-30)
- Platform admin dashboard is now focused on operator-level reports (orders, subscriber sites, payment failures, sales and enquiries).
- Business-owner/demo operational panels are removed from main /admin surface to keep platform and subscriber responsibilities separated.

## Platform sales outreach architecture foundation
- Sales leads remain persisted platform records with source/provider/service-area metadata and suppression fields (marketingStatus, unsubscribedAt, doNotContactReason).
- Campaign foundation models (SalesCampaign, SalesCampaignRecipient, SalesCampaignEvent) now support prepared/sent tracking and future event ingestion.
- Resend campaign webhook endpoint exists as a verification-required stub (/api/resend/webhook) and rejects unverified processing in this phase.

## 2026-05-30 update: subscriber-owned settings visibility
- Site-admin (`/site-admin/[siteSlug]`) now surfaces core controls in an operational order with `Bookings` first.
- `Site appearance` is a dedicated section using Light/Dark mapping (`visualThemeId` + `colourPaletteId` under the hood).
- Platform support view (`/admin/sites/[siteId]/settings`) wording now clearly distinguishes persisted subscriber data from demo tooling.
