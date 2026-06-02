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
3. Platform admin clicks `Create subscriber site` / `Create blank subscriber site`.
4. Backend creates or links `TenantSite` for the setup request.
5. Backend creates baseline records:
- `SiteDomain`
- `SubscriptionRecord` placeholder
- default provisioning checklist tasks
- provisioning timeline/status events
6. Backend seeds a clean subscriber-site structure:
- selected industry context
- default theme/palette and baseline settings shape
- empty/editable services, staff, scheduling, pages and policies
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
- demo/sales data should not be copied into live subscriber-site records by default.

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

## Subscriber business-owner access bootstrap
- Platform admin can now bootstrap tenant-scoped business-owner users in:
  - `/admin/sites/[siteId]/settings` (`Business owner access` section)
- Bootstrap creates/updates `CustomerSiteAdminUser` records for that tenant.
- Temporary access code is generated for secure handoff (no plaintext persistence).
- This is separate from platform-admin auth and does not grant platform admin access.

## Business-owner operational expansion
- Initial business-owner dashboard now manages persisted:
  - staff roles
  - staff members
  - available weekdays
  - rota days
  - break windows
  - business closures
  - staff holidays
- Booking list is available as read-only summary in this pass.
- No customer/staff auth and no payment/email/Twilio integrations are added here.

## Provisioning note: branding media
- Subscriber sites are still created as clean/blank data structures.
- Branding media can then be uploaded by site-admin per tenant site using tenant-scoped storage keys.
- Logo/favicon upload is now available as first real media storage slice; broader media remains future scope.

## Provisioning note: payment setup fields
- New subscriber sites can now carry persisted payment setup intent fields from day one.
- These fields support onboarding and support workflows before real provider integration.
- Sites remain shared-app, tenant-scoped records in the central database.

## Current commercial payment step
- Setup submission captures order intent and provisioning details.
- Live checkout/payment capture is not automated in this phase.
- Platform admin confirms payment/subscription onboarding manually after setup request submission.
- Domain confirmation and payment confirmation happen before final go-live status is set.

## Public funnel wording alignment (2026-05-30)
- Public CTA language now emphasizes `Order now` for setup start.
- `/setup/[industry]` is treated as the order-start route with a selectable website type in Step 1.
- Internal persistence remains `SetupRequest`; this is naming at the data layer, not a public checkout claim.

## Stripe billing foundation (v1)
- Setup requests can launch Stripe Checkout from confirmation links using token-hardened access.
- Webhook events update payment status and Stripe IDs on SetupRequest before provisioning progresses.
- Fallback remains manual onboarding when Stripe env/config is missing.

## Platform operations dashboard update
- Order queue monitoring is now surfaced from /admin as Order Requests with in-page status reporting and link-out to /admin/setup-requests.
- Subscriber provisioning visibility is surfaced from /admin as Subscriber Sites with live-site count and recent-site reporting.
- Payment failure monitoring is prepared at platform level and will populate as Stripe/webhook subscription failures are connected.

## Sales outreach readiness note (2026-05-30)
- Platform sales pipeline now captures richer prospect source/provider fields and supports duplicate-reviewed CSV import.
- Campaign preparation states are now tracked before any live sending.
- Live campaign send automation remains intentionally disabled until verified unsubscribe/suppression and webhook verification are fully wired.

## 2026-05-31 order and payment handoff update
- Setup order submission now creates SetupRequest and, when Stripe is configured, immediately starts Stripe Checkout.
- Setup confirmation page is positioned as post-payment / next-steps state rather than pre-payment stop.
- SetupRequest persists before checkout handoff so admin queue visibility remains intact even if payment is cancelled.

## 2026-06-01 cancelled-order queue cleanup
- Cancelled setup requests can now be removed from the active queue by platform admin.
- Removal is implemented as soft archive on `SetupRequest.archivedAt`.
- Active queue list excludes archived requests by default.
- This cleanup action is restricted to cancelled requests only and does not remove tenant sites or Stripe subscription data.

## 2026-06-01 paid-order provisioning milestone
- New admin-only endpoint: `POST /api/admin/setup-requests/[id]/create-subscriber-site`.
- Provisioning guardrails:
  - platform-admin session required
  - setup request must be paid (`PAID`/`SUBSCRIPTION_ACTIVE`)
  - cancelled or archived requests are rejected
- Provisioning is idempotent:
  - existing `TenantSite` linked to setup request is reused
  - duplicate `TenantSite`/`SiteDomain`/`SubscriptionRecord` rows are not created
- New site starts clean (no demo copy of services/staff/rota/bookings/vouchers).
- Response includes links:
  - public: `/sites/[siteSlug]`
  - subscriber admin: `/site-admin/[siteSlug]`
- Routing expectation:
  - `/sites/[siteSlug]` is currently the platform/dev preview route for tenant rendering.
  - Final customer-facing destination will be customer domain host routing (`host/domain -> SiteDomain -> TenantSite`) in a later milestone.
- No DNS/AWS/custom-domain automation is included in this pass.

## 2026-06-01 subscriber admin onboarding shell
- Provisioned tenant sites now have a business-owner onboarding shell at `/site-admin/[siteSlug]`.
- Shell is tenant-scoped and separate from platform admin controls.
- Dashboard includes:
  - setup section cards (business details, services, staff, rota, policies, payments, CRM placeholders)
  - `Get your site ready` checklist using real tenant data/empty states
  - `Preview public site` action linking to `/sites/[siteSlug]`.

## 2026-06-01 public subscriber shell polish + cookies
- `/sites/[siteSlug]` now uses a cleaner public nav focused on customer pages: Home, Services, Book now, About, Contact.
- Staff login and Business admin login are footer-level links to avoid over-promoting operator actions in the hero/nav area.
- Footer now includes policy links:
  - Privacy Policy
  - Cookie Policy
  - Terms / Policies
- Cookie acceptance is currently a simple local browser consent banner (no third-party cookie manager in this phase).

## Business admin access handover (email)
- Platform admin can generate/reset business admin access codes from `/admin/setup-requests` for provisioned sites.
- Access code is stored hashed (`CustomerSiteAdminUser.accessCodeHash`), never plaintext in DB.
- On generate/reset, system now attempts transactional email handover to the site admin email.
- API is fail-soft: code generation succeeds even if email fails or is not configured.
- Platform admin UI displays email delivery status and still shows one-time code for temporary dev/hosted handover.
- One-time on-screen code display is temporary; secure email-first delivery is the target flow.
- Deliverability checklist for hosted:
  - configure SPF, DKIM, and DMARC for `myexperiment.club`
  - use verified `EMAIL_FROM` domain alignment
  - test inbox placement in Outlook/Hotmail/Gmail and monitor junk/spam during reputation warm-up.
## Subscriber Services Management

- Provisioned subscriber sites start with no copied demo services.
- Business owners manage real tenant services from `/site-admin/[siteSlug]` under `Services/prices`.
- Service rows belong to the tenant site and include name, description, price, duration, visibility, recurring/block-booking flags, and ordering.
- Hiding/removing an existing service marks it inactive for public display rather than copying or exposing demo data.
- `/sites/[siteSlug]` reads active tenant services only. If there are no active services, the public Services section shows the clean empty state.
- Public booking remains future work; service cards currently show a disabled `Book this service (coming soon)` action.
- The subscriber-admin preview action opens `/sites/[siteSlug]` in a new tab so site owners can compare admin changes with the public preview.
- The onboarding page separates progress from navigation: `Get your site ready` shows completion status and `Setup section guide` maps the setup areas with `Open` navigation labels.
- Service categories are tenant-scoped and let business owners group active public services; inactive categories are not shown publicly and their active services fall back to uncategorised/other grouping.
- Service-level recurring and block-booking settings are saved as tenant service configuration for later booking setup; recurring interval selection is single-select. No full recurring billing or multi-session booking engine is connected in this pass.
- After service save, the admin refreshes its server-derived checklist counts so `Add at least one service` reflects active services immediately.
- Public subscriber homepages now prioritise service categories/services. Contact, policy, account, staff, and admin links are secondary header/footer/support items, not large homepage diagnostic tiles.

## Subscriber Staff Management

- Business owners manage tenant staff from `/site-admin/[siteSlug]` under `Staff setup`.
- Staff records belong to the tenant site and include first/last name entry, display name, role/position, email, phone, active visibility, customer-selectable/bookable flag, and notes/bio.
- Subscriber admin displays a single business-friendly `Role / Position` field and hides internal/platform role labels.
- Hiding/removing an existing staff member marks it inactive so future bookings/rota references can remain safe.
- `/sites/[siteSlug]` no longer shows staff as a large homepage tile; active tenant staff remains available for future booking/staff-choice flows.
- Staff rota/availability and staff login/auth remain future milestones.

## Service editor and public visibility polish

- Subscriber services in `/site-admin/[siteSlug]` now behave like a compact management list: persisted services are collapsed by default and expand only for the selected edit row.
- New service drafts open expanded immediately, then collapse after a successful save once they become persisted rows.
- Service category assignment remains tenant-scoped and is visible in the collapsed admin summary plus the public grouped services view.
- `/sites/[siteSlug]` respects optional About and Policy visibility in public navigation/sections; Contact remains a standard visible page for subscriber sites in this phase.

## Subscriber opening hours milestone

- Provisioned tenant sites now store structured business-wide opening hours on `CustomerSiteSettings.openingHoursJson`.
- `/site-admin/[siteSlug]` lets business owners configure Monday-Sunday open/closed state with opening and closing times.
- The existing `openingHoursSummary` remains as a generated readable summary for public display and support views.
- Opening hours are separate from staff rota: business hours define the normal operating window, while staff availability, breaks, holidays, and closures remain later booking-availability layers.
- `/sites/[siteSlug]` keeps services as the main public content and shows opening hours only in the small contact/footer area.
