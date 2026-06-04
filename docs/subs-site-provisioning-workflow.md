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
- Tenant-scoped booking records can now be created for a selected subscriber site.
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
- Stripe Checkout/Billing is the current MyExperiment.club subscription checkout foundation.
- Platform admin creates the clean subscriber site only after Stripe/webhook payment status is paid enough to fulfil (`PAID` or `SUBSCRIPTION_ACTIVE`).
- Domain confirmation and payment confirmation happen before final go-live status is set.
- Subscriber-site payment processor integrations remain separate future work.

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
- Clean provisioning also creates baseline fulfilment task rows for review, business details, domain, subscription linkage, clean site settings, DNS, ready and live checks.
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
- When `Create blank subscriber site` creates a new tenant from a paid setup request, the platform now also creates the first tenant-scoped owner/admin access record and attempts the same onboarding email automatically.
- If provisioning is retried for an already-created site, the existing tenant site/access state is reused and no duplicate `TenantSite`, `CustomerSiteAdminUser`, `SiteDomain` or `SubscriptionRecord` rows are created.
- Business-owner login remains separate from platform-admin login:
  - `/site-admin/[siteSlug]` is protected by tenant-specific `CustomerSiteAdminUser` credentials.
  - `/site-admin/[siteSlug]/login` forwards to the shared site-admin login form with the site slug/callback filled in.
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

## Subscriber staff rota milestone

- Staff rota uses the existing tenant-scoped `CustomerSiteStaffRotaDay` model; no duplicate rota model was added.
- `/site-admin/[siteSlug]` lets business owners configure normal weekly staff availability for active staff members.
- Rota sits underneath business opening hours: business hours define when the business is open; staff rota defines when each staff member normally works inside or around those hours.
- Simple break windows use the existing `CustomerSiteStaffBreakWindow` model and are validated to sit inside a working rota day.
- Closures and staff holidays remain date-specific override layers for later booking availability work.
- Public tenant sites stay service-led and do not expose internal staff rota details.

## Subscriber closures, holidays and staff leave milestone

- Business closures and staff leave use existing tenant-scoped scheduling models, extended with date ranges and notes for real operational use.
- `/site-admin/[siteSlug]` now groups these controls as `Closures, holidays and staff leave` under the scheduling area.
- Business closures are whole-site overrides for holidays, shutdown days, training days, or short partial-day closures.
- Staff leave is staff-specific unavailability for holidays, appointments, sickness, or other internal leave.
- Validation rules:
  - end date cannot be before start date
  - partial-day entries require both start and end time
  - same-day partial-day entries must end after they start
  - staff leave must reference staff belonging to the same tenant site
- These records form future booking-availability override layers. The intended hierarchy is business opening hours -> staff rota -> business closures -> staff leave -> existing booking conflict checks.
- Public tenant sites stay customer/service-led and do not show internal staff leave. A small active/upcoming business closure notice may appear in the footer/contact area when relevant.
- Provisioning remains clean: no demo closures, holidays, staff leave, bookings, services, or vouchers are copied into paid subscriber sites.

## Subscriber availability calculation milestone

- A reusable tenant-scoped availability calculator now powers both public and site-admin availability previews.
- API routes:
  - public: `GET /api/sites/[siteSlug]/availability?serviceId=...&date=...&staffId=...`
  - site-admin: `GET /api/site-admin/[siteSlug]/availability?serviceId=...&date=...&staffId=...`
- The site-admin endpoint requires subscriber-admin access and returns debug/setup reasons.
- The public endpoint returns only slots and customer-friendly messages.
- The calculation is deterministic and does not use demo/localStorage data.
- Availability hierarchy in this first pass:
  1. service must belong to the tenant and be active
  2. business must be open for the selected date
  3. staff must belong to the tenant and be active
  4. staff rota must contain a working window for the selected date
  5. business closures block all staff/services
  6. staff breaks and staff leave block that staff member
  7. existing `SUBMITTED`/`CONFIRMED` subscriber bookings block overlapping slots where date/time/staff data exists
- Slot generation uses 15-minute increments and applies the selected service duration plus buffer when checking conflicts.
- The public site now presents generated slots as compact grouped start-time chips and can create confirmed bookings after the server rechecks availability.
- Payment/prepayment, customer/staff login, amendment/reschedule handling, target staffing persistence, and calendar sync remain future milestones.

## Platform domain/go-live workflow milestone

- Tenant/domain/subscription state remains centralised in existing models:
  - `TenantSite`
  - `SiteDomain`
  - `SubscriptionRecord`
  - `SiteStatusEvent`
  - `SiteProvisioningTask`
- No schema migration was required for the first go-live workflow. Statuses are stored as lifecycle strings in existing status fields.
- Admin lifecycle actions are exposed through `POST /api/admin/sites/[id]/lifecycle`.
- Supported actions:
  - `MARK_DNS_INSTRUCTIONS_SENT`: marks domain work as pending/instructions sent and completes the DNS preparation task.
  - `MARK_DOMAIN_READY`: marks domain/SiteDomain as configured and ready.
  - `MARK_SITE_LIVE`: marks the tenant site live and updates the linked setup request to `SITE_LIVE`.
  - `SUSPEND_SITE`: marks the tenant site/subscription/domain as suspended for platform tracking.
- Domain purchase and DNS changes remain manual in this pass.
- Runtime custom-domain design:
  1. customer domain/subdomain points DNS to the shared MyExperiment.club app/hosting target
  2. app reads the incoming `Host`/`x-forwarded-host` header
  3. host is normalised by `src/lib/sites/tenant-resolver.ts`
  4. `SiteDomain.domain` is matched, including root/www candidate handling
  5. matched `SiteDomain` resolves to `TenantSite`
  6. tenant-scoped public site is rendered from the shared app and central database
- `getLiveTenantSiteByDomainHost()` is prepared for future live host routing; current debug tooling can still test broad domain matches before the domain routing switch is enabled.
- `/sites/[siteSlug]` remains the safe preview route and does not require custom-domain routing to work.
- Provisioning remains clean: no demo data is copied into paid subscriber sites.

## 2026-06-02 Booking Provisioning Note

- Clean provisioned subscriber sites now have the first real guest booking flow once the business owner has configured services, opening hours, staff, and rota.
- Public bookings are stored as tenant-scoped `CustomerSiteBooking` rows and remain part of the shared app/central database model.
- Bookings are not copied from demos or localStorage.
- Public slot bookings default to `CONFIRMED` after the server rechecks availability. Legacy `REQUESTED`/`SUBMITTED` records can still be confirmed by the business owner in `/site-admin/[siteSlug]`.
- Customer and business notification emails are attempted fail-soft when a public booking is confirmed. Site-admin cancellation also attempts a customer cancellation email.
- Amend/reschedule handling is still a future booking-management pass.
- Payment/prepayment, customer login, staff login, calendar sync, and recurring booking fulfilment remain future milestones.

## 2026-06-02 Rota Coverage and Compact Slot UI Note

- Public subscriber sites group available times into `Morning`, `Afternoon`, and `Evening` and show start-time chips so short services do not create unusably long vertical lists.
- The selected public chip remains highlighted and the booking form shows the full selected time range. If the visitor chose `Any available staff`, the selected summary says staff will be assigned automatically while preserving the internal staff assignment.
- Site-admin rota helpers now separate intent:
  - `Set Monday-Friday as working` turns weekdays on and applies sensible default times.
  - `Copy Monday times to working weekdays` only copies times into weekdays that are already working.
- Non-working rota days clear and persist unset start/end times.
- The first `Staffing coverage` visualisation counts active staff whose rota overlaps business opening hours. It uses interim red/amber/green/grey logic until target staffing levels are stored.

## 2026-06-02 Admin Booking Amendment Note

- `/site-admin/[siteSlug]` now supports admin-side booking amendments for active tenant bookings.
- The amendment panel can update customer contact details, notes, status, service, staff, and date/time.
- Reschedule availability is calculated through the tenant availability helper with the current booking excluded, so the booking does not block its own current slot.
- Other active bookings and normal scheduling rules still block unavailable slots, and the API rechecks availability before saving.
- Customer update notifications are fail-soft. Manual override, customer self-service rescheduling, and full booking audit history remain future milestones.

## 2026-06-02 Booking Policy and Payment Status Note

- Public tenant policy pages now always render for valid tenant sites and fall back to the standard booking/cancellation policy when custom policy content is missing.
- Subscriber admins must either customise policy wording or explicitly accept the default policy before the setup checklist marks policy complete.
- Public bookings remain tenant-scoped and are server-forced to `CONFIRMED` after availability is rechecked.
- Booking payment state is tracked on `CustomerSiteBooking` with `paymentStatus` and `paymentMethod`.
- Subscriber-site payment provider checkout is not connected yet. Pending prepayment/manual/cash cases are recorded honestly and shown to both customer and site admin without collecting card details.

## Subscriber Booking Payment Checkout

- Provisioned tenant sites can now take first-pass card prepayment for bookings through Stripe Checkout when prepayment is enabled in site admin settings.
- This is tenant-scoped by booking and tenant metadata, but it currently uses the configured platform Stripe environment rather than a full per-business connected-account onboarding flow.
- Webhook confirmation is the source of truth for `PAID`; frontend return URLs only display the current booking payment state.
- Site admins can see booking payment method, status, amount, provider, checkout session, and payment intent references in the Bookings section.
- Cash/manual booking payment handling remains separate and can still be marked paid manually.
- DNS/custom domain provisioning is unaffected by this payment milestone.

## Booking Cancellation and Refund Operations

- Provisioned tenant sites now have a first-pass admin cancellation workflow for live bookings.
- Cancellation stores tenant-scoped `cancelledAt`, optional cancellation reason, refund status, and refund guidance on the booking record.
- Refund eligibility guidance uses the tenant site's configured full-refund and no-refund windows.
- Online card provider refunds are intentionally not automated yet; admins receive manual-required guidance for paid card bookings.
- Cancellation email delivery is fail-soft and does not block saving the cancellation.

## Customer Booking Lookup

- Subscriber booking confirmation/update/cancellation emails can now include a secure no-login customer booking link.
- Tokens are signed with server-side secret material and include tenant/site/booking context, so the booking page re-checks the token against the requested site slug and tenant before loading data.
- This is not a full customer account system. It is a controlled single-booking lookup flow for customer convenience and smoke testing.
- Customer cancellation is only allowed for unpaid/manual/no-online-payment future bookings; paid/card bookings require direct business contact for refund review.

## Shared Staff Appointment View

- After a paid setup request creates a clean tenant site, the business owner can configure staff in `/site-admin/[siteSlug]` without copying demo staff data.
- Staff setup now includes access handover controls for saved active staff members:
  - generate/reset staff access code
  - enable/disable staff access
  - staff login link `/site-staff/[siteSlug]`
- Staff access is intentionally separate from platform admin and subscriber business admin.
- Staff access codes are hashed in `CustomerSiteStaffMember.staffAccessCodeHash`; `staffAccessEnabled` controls whether the staff member can log in.
- `/site-staff/[siteSlug]` is a shared appointment diary for the tenant site. It reads tenant bookings from the central database and does not expose platform provisioning controls.
- This milestone does not send staff access emails automatically, create demo data, add full staff permissions, or implement staff-specific booking ownership.

## Customer Accounts and Staff Permissions v1

- Clean provisioned tenant sites can now support first-pass customer accounts without copying demo customers or bookings.
- Customer records are stored in `CustomerSiteCustomer` and scoped by `tenantSiteId` plus email uniqueness within that tenant.
- New bookings created while a customer is logged in store `customerSiteCustomerId`; when a customer registers/logs in, existing guest bookings for the same tenant and normalised email are linked to that customer account where safe.
- `/sites/[siteSlug]/account` is the customer dashboard for tenant-linked bookings. It is separate from platform admin, business admin, and staff access.
- Business owners manage staff access and permissions from `/site-admin/[siteSlug]` in Staff setup.
- Staff permissions are stored on the staff member record and are enforced by `/site-staff/[siteSlug]` plus staff booking action APIs.
- Standard staff access is deliberately limited. Super-user staff permission flags prepare the route for controlled operational actions without granting platform or subscriber-admin access.
- Provisioning remains clean: no demo services, staff, bookings, vouchers, customers, or localStorage data are copied into paid subscriber sites.

## Site Domain Go-Live Workflow Update

- The fulfilment path is now: paid setup request -> create clean tenant site -> preview at `/sites/[siteSlug]` -> prepare/copy DNS instructions -> mark DNS instructions sent -> mark domain ready -> mark site live.
- Platform admin can manage domain/go-live state in `/admin/sites` without automating registrar, DNS provider, SSL/certificate, or hosting resource changes.
- DNS copy is available from the selected site domain panel and can be sent to customers using their own domain or used internally when MyExperiment.club manages the domain.
- `SiteDomain` remains the central mapping for the future production route: incoming host -> normalised host candidates -> `SiteDomain.domain` -> `TenantSite` -> tenant-scoped public site rendering.
- `resolveTenantSiteByHost()` is available for the future runtime host-routing milestone and the existing domain resolution debug tooling.
- Marking live attempts a fail-soft go-live email to the setup request contact email. The lifecycle state still updates when email is not configured or delivery fails.
- Reactivation restores a suspended test/customer site to active platform tracking where safe; it does not restart Stripe or automate external services.
- `/sites/[siteSlug]` remains the safe preview route until custom-domain host routing is switched on.

## Subscriber gift vouchers v1

Provisioned subscriber sites start with gift vouchers disabled. No demo voucher records, demo staff, demo services or localStorage voucher data are copied into a paid tenant site.

After provisioning, the business owner can open `/site-admin/[siteSlug]`, choose **Gift vouchers**, configure voucher settings and publish the public voucher page. The public preview route `/sites/[siteSlug]/vouchers` is available only when voucher settings are enabled and public-visible.

Voucher purchases are conservative in this milestone. Without a subscriber payment-provider integration, public voucher requests are stored as `PENDING_PAYMENT`. The business/admin confirms payment manually, which activates the voucher and can trigger purchaser/recipient email delivery. Subscriber payment-provider checkout for vouchers remains future work.

Staff redemption is tenant-scoped through `/site-staff/[siteSlug]` and requires the saved `redeemVouchers` staff permission.

## Domain/go-live workflow expansion

`/admin/sites` now supports a clearer manual domain workflow around existing `TenantSite`, `SiteDomain`, `SubscriptionRecord`, provisioning task and status-event records. No new app/database is created per customer.

Operational steps supported in platform admin:

1. Create/reuse the clean subscriber site.
2. Record or edit the intended live SiteDomain.
3. Track whether the customer owns the domain, the platform will manually buy/manage it, or advice is still needed.
4. Mark domain search started for platform-managed domains.
5. Mark domain purchased manually and record registrar/renewal/ownership notes.
6. Copy DNS instruction text without inventing unknown hosting targets.
7. Mark DNS instructions sent or waiting for customer DNS.
8. Mark DNS configured.
9. Mark domain ready.
10. Mark the site live and attempt the go-live email.
11. Suspend/reactivate where needed.

SiteDomain input is normalised and checked against active domains on other tenants before saving. Primary SiteDomain rows update `TenantSite.domainPrimary`.

Final custom-domain rendering remains the next hosting/routing milestone: customer domain -> shared app -> host header -> `SiteDomain` -> `TenantSite` -> tenant-scoped public site. `/sites/[siteSlug]` stays as the platform preview route for now.

## Customer account and payment requirement flow
- Provisioned tenant sites expose customer account routes under `/sites/[siteSlug]/account`.
- Customer sessions are tenant-scoped and separate from platform-admin, business-admin and staff access.
- Booking creation can associate to a logged-in customer account, but guest booking is still supported.
- Business payment settings control whether public booking can be submitted:
  - no prepayment: booking can be confirmed without online payment.
  - cash/manual enabled: booking can be confirmed and reconciled manually by the business.
  - prepayment + card required without connected tenant checkout: booking is blocked and the customer is told to contact the business.
- Subscriber payment-provider integration remains future work. Platform Stripe billing for MyExperiment.club subscriptions must not be treated as tenant checkout for customer bookings.

## Customer CRM foundation after provisioning
- Provisioned tenant sites now include a customer account/CRM foundation once public bookings are enabled.
- Guest bookings remain allowed, but when a customer later registers/logs in with the same email, tenant-matched guest bookings are linked to the account and visible in their account dashboard.
- Marketing consent is stored per `CustomerSiteCustomer` and defaults to opted out. It is not global across MyExperiment.club or other tenant sites.
- Tenant-scoped customer contact enquiries are stored separately from platform sales/contact enquiries.
- Business owners can review customer booking history, upcoming/completed/cancelled counts, payment-status context and contact enquiries in `/site-admin/[siteSlug]` under Customer CRM.
- CRM rows are grouped by tenant plus normalised email where practical. Guest bookings, account customers and contact enquiries with the same tenant/email are shown together; cross-tenant data is never merged.
- Internal CRM notes can be saved for account customers. Business admins can mark an opted-in customer as do-not-contact/suppressed, but the CRM does not provide silent admin opt-in.
- Special offers now support controlled one-off subscriber customer campaigns from Customer CRM. Business admins can draft a subject/body, choose all opted-in, selected opted-in, possible lapsed customers or customers with booking history, preview the email and send only to eligible opted-in tenant customers.
- Customer campaign sends are tenant-scoped and separate from platform prospect campaigns in `/admin/sales`. Server-side checks skip customers without consent, invalid/missing emails, inactive customers, duplicate recipients and already-sent recipients for the same campaign.
- Subscriber customer marketing unsubscribe links use `/sites/[siteSlug]/unsubscribe/customer-marketing?token=...` and update that tenant customer's marketing consent only. Transactional booking emails are not affected.
- Customer account Special offers display remains a placeholder; active/targeted in-account offer rendering is future work.
- Lapsed-customer follow-up remains manually selected/sent only. No automated campaigns, birthday automation, SMS/WhatsApp sends or payment-provider APIs are active in this milestone.

## Custom-domain runtime rendering

The production domain path is now:

1. Customer domain/subdomain points to the shared MyExperiment.club app/hosting target.
2. The app receives the original `Host` / `x-forwarded-host` header.
3. Middleware recognises non-platform hosts and rewrites them internally to `/tenant-domain-runtime/[[...tenantPath]]`.
4. The runtime route uses `getLiveTenantSiteByDomainHost()` to resolve `SiteDomain.domain` to `TenantSite`.
5. The existing tenant public site pages render using the matched tenant slug.

`/sites/[siteSlug]` remains the preview/support route for platform admins. Subscriber admin remains `/site-admin/[siteSlug]` on the platform host for now.

Host/domain rules:
- Hosts are normalised by lower-casing, removing protocol/path/port and trimming trailing dots.
- Apex and `www.` candidates are considered.
- Live rendering requires a live-ready SiteDomain and a `LIVE` tenant status/provisioning status.
- Suspended/cancelled tenant matches render a generic unavailable page.
- Unknown custom hosts return no tenant content.

Manual work still required:
- Domain purchase/registration.
- DNS or nameserver updates.
- Hosting/custom-domain attachment and certificate checks.
- Any registrar/provider-specific automation.

No separate customer app or database is created. All public rendering remains tenant-scoped inside the shared app and central database.
- Customer-account session cookies are scoped at `/` so account login works on both `/sites/[siteSlug]/account` preview routes and custom-domain `/account` routes.
- `/my-account` is accepted as a customer-friendly alias for `/account` on custom-domain hosts.
- `/api/site-resolve-debug` is platform-admin protected and returns safe proof fields including received/normalised host, matched tenant, matched domain, domain/DNS/SSL status and the internal rewrite target.
- `/admin` and `/api/admin` are not exposed through customer-domain routing. Platform admin remains on the platform host.

## DNS instruction handover

The Domain panel in `/admin/sites` now supports platform-admin editable DNS/hosting target values per `SiteDomain`. Use this field for exact nameservers, CNAME records, A records, TXT verification records or Amplify/hosting verification values once they are known. Do not invent values; if the target field is blank, admin should see a warning and customer email sending is blocked.

The generated instruction copy is customer-facing and should refer to the customer's business/site, not a "new MyExperiment.club website". It includes:
- business/site name
- final domain
- domain option
- saved DNS/hosting target values
- `/sites/[siteSlug]` preview route
- `/site-admin/[siteSlug]` subscriber admin route
- support wording for customers who are unsure how to update DNS

`Send DNS instructions` sends to the setup request contact email using the existing transactional email provider. Email delivery is fail-soft. If sending fails or email is not configured, the status does not advance and platform admin can copy the instructions manually. If sending succeeds, the relevant SiteDomain records a sent status/timestamp/recipient in `dnsInstructions` metadata and the site/domain lifecycle moves to `DNS_INSTRUCTIONS_SENT`.

For customer-owned or customer-managed domains, the next operational state after successful instruction handover is `WAITING_FOR_CUSTOMER_DNS`. For platform-managed domains, admin continues manual registrar/DNS setup and then marks DNS configured/domain ready.

## Subscriber payment-provider readiness

Provisioned tenant sites keep subscriber customer payments separate from platform subscription billing. The platform Stripe flow proves MyExperiment.club subscription payment, but it is not a tenant business payment processor connection.

Current fulfilment handover should explain:
- payment provider selection in business admin records setup intent only;
- no API keys, webhook secrets, access tokens or card details should be entered;
- manual/cash/card-terminal payment recording is available where enabled;
- if prepayment is required but provider checkout is not connected, public booking is blocked with a contact-business message;
- saved cards are future provider-vaulted features, not locally stored card details.

Provider-specific setup in `/site-admin/[siteSlug]` is now presented as a top-level `Payment settings` tile, separate from `Business settings`. The UI is split into `Payment processor setup`, `Booking payment options`, and `Booking and cancellation policy`. `None / no online payment provider` supports cash-only/manual-only businesses, while `I would like help setting one up` shows Square first (`https://squareup.com/i/DC9E585AB0`) and Stripe second (`https://www.stripe.com`) as guidance links. Technical connection values such as Account Link state, masked Stripe account reference, webhook readiness and checkout readiness sit behind collapsed `Technical diagnostics`, not in the normal setup form. The payment-provider foundation still has a tenant-scoped `CustomerSitePaymentProviderConnection` record for non-secret provider connection metadata: provider, connection mode, test/live environment, account metadata, public enabled flag, status, timestamps, setup notes and a future secure-secret reference. This is separate from `CustomerSiteSettings`, which still stores the business owner's operational payment preferences.

Stripe and Square expose provider connection route foundations:
- `POST /api/site-admin/[siteSlug]/payments/stripe/connect/start`
- `GET /api/site-admin/[siteSlug]/payments/stripe/connect/callback`
- `POST /api/site-admin/[siteSlug]/payments/square/connect/start`
- `GET /api/site-admin/[siteSlug]/payments/square/connect/callback`

Stripe uses Accounts v2 plus Stripe-hosted Account Links. The start route requires the current tenant site-admin session, creates or reuses a connected account ID, stores only non-secret account metadata, and redirects to Stripe onboarding. The refresh URL creates a new Account Link, and the return callback retrieves the account to update connected/pending/needs-attention status. User-facing labels say Account Link Pending / Account Link Connected, while existing internal `OAUTH_PENDING` / `OAUTH_CONNECTED` values remain for compatibility. `STRIPE_CONNECT_CLIENT_ID` is not required for this path. Square remains an OAuth placeholder until a provider-specific safe connection path is completed. PayPal, SumUp/Zettle, Worldpay and Other remain assisted setup/manual guidance only.

Stripe Accounts v2 creation includes `defaults.responsibilities.fees_collector=stripe` and `defaults.responsibilities.losses_collector=stripe`, as required by the current sandbox Account Links flow. If Stripe returns `invalid_fields` for responsibility fields, the site-admin UI surfaces a safe setup error and leaves the provider unconnected.

Future go-live checklist for provider checkout must include secure credential storage or provider-managed onboarding, test/live mode, provider-specific webhook signature validation, tenant/booking mapping, idempotency and refund/status handling. Tenant webhook routes now live at `/api/sites/payments/stripe/webhook` and `/api/sites/payments/square/webhook`; Stripe verifies `STRIPE_TENANT_WEBHOOK_SECRET`, while Square remains a `501` verification-required stub.

Stripe tenant booking webhook setup:
- URL: `https://myexperiment.club/api/sites/payments/stripe/webhook`
- Stripe scope: `Connected accounts` / `Events on Connected accounts`
- Payload style: `snapshot events`, not thin events
- Required events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`

The tenant Stripe handler reads the full snapshot object metadata from `event.data.object` to verify `paymentPurpose=TENANT_BOOKING`, `tenantSiteId` and `bookingId`. Thin events are rejected rather than acknowledged because they do not include the full object needed by the current booking updater.

Booking guardrails remain conservative. A connected provider account does not automatically mean checkout is live. If card prepayment is required and a provider is connected but booking checkout has not been implemented, public booking stays blocked with customer-facing copy telling the customer that online payment setup is connected but checkout is not enabled yet.

Stripe Connect is now the first provider-specific checkout path. Provisioning/support should verify:
- the subscriber admin has connected Stripe from `/site-admin/[siteSlug]` `Payment settings`;
- `CustomerSitePaymentProviderConnection.provider=STRIPE` has a connected account ID and `connectionStatus=CONNECTED`;
- `STRIPE_TENANT_WEBHOOK_SECRET` is configured for `/api/sites/payments/stripe/webhook`;
- public checkout is enabled only for fixed-price services, not quote-required services;
- Stripe webhook confirmation, not frontend return, marks tenant bookings paid.

The first charge approach is Stripe Checkout in the connected account context using the tenant `acct_...` ID, while platform subscription billing remains on the separate MyExperiment.club setup/subscription Stripe flow. Pending tenant checkout sessions hold the slot only while the Checkout session is valid, using Stripe expiry where recorded and a 30-minute fallback hold window otherwise. Stripe expiry marks the booking cancelled with `paymentStatus=EXPIRED`; payment-intent failure marks it cancelled/failed. Site-admin has a manual cleanup action for expired pending payments after expiry/fallback.

Refunds remain manual in Stripe for now. The app stores Stripe session/payment-intent/account references for operator guidance, but live refund automation waits for provider refund IDs and idempotent refund tracking.

Detailed architecture is documented in `docs/subs-payment-provider-architecture.md`.
Use `Send DNS instructions` only when the customer or their domain contact needs to update DNS. For platform-managed domains, keep the DNS/hosting target values as internal fulfilment notes unless the customer needs them.

The domain resolution tester remains an internal mapping check only. It confirms whether an entered host maps to a `SiteDomain`/`TenantSite` record inside the app. It does not prove public DNS propagation, SSL/certificate readiness, domain purchase, or external DNS provider configuration.

## Domain/DNS status workflow expansion

`SiteDomain` now has explicit nullable workflow fields for platform-admin tracking: setup mode, domain/DNS/SSL status, instruction/check/go-live timestamps, expected DNS target, expected nameservers, manual DNS check result and notes. The existing `status` field remains the broad lifecycle value used by resolver/admin summaries.

Initial setup from paid provisioning:
- existing customer domain -> domain details/DNS instructions needed
- new domain managed by MyExperiment.club -> domain purchase/check workflow needed
- unsure -> advice/details needed

Admin `/admin/sites` now surfaces a **Domain and DNS** workflow panel with:
- current site slug and `/sites/[siteSlug]` proof route
- requested/final domain
- setup mode
- domain/DNS/SSL statuses
- expected DNS target/nameservers
- notes and manual DNS check recording
- copy/email DNS instruction flow

Subscriber admin `/site-admin/[siteSlug]` shows a read-only **Domain setup** card with preview URL, requested domain, current status and customer-friendly next-step guidance. It does not expose platform-only lifecycle controls.

Domain/DNS remains manual in this milestone. There is no Route 53 registration, registrar API call, DNS provider write, AWS resource creation, automatic SSL issuance, or external DNS automation.


## Platform billing test route

Platform fulfilment can use `/admin/billing-test` to smoke-test MyExperiment.club platform Stripe Checkout without creating or modifying a setup request. This is deliberately separate from paid setup request fulfilment and separate from subscriber Stripe Connect booking payments.

The billing test route uses the platform Stripe account and either `STRIPE_PLATFORM_TEST_PRICE_ID` or a price resolved from `STRIPE_PLATFORM_TEST_PRODUCT_ID`. It does not create a `TenantSite`, `SiteDomain`, `SubscriptionRecord`, booking, or Stripe connected-account charge. A successful return confirms the platform Checkout Session can be created and returned; real setup request payment state is still updated only by `/api/stripe/webhook` events that carry a real `setupRequestId`.

The billing test diagnostics are runtime server checks with no-store caching. If Amplify env vars were added but hosted still reports them missing, confirm the correct app/branch env, redeploy after the env change, and check the runtime diagnostic timestamp on `/admin/billing-test`.

Amplify builds generate `.env.production` explicitly in `amplify.yml`. New server-side env vars must be added to that preBuild list or hosted SSR/API routes will not see them even when the Amplify UI shows them configured. The platform billing test vars and tenant webhook secret are now included there.

## Payment setup fulfilment support

Provisioned subscriber sites expose payment setup as a tenant-owned business-admin task. Stripe onboarding uses Account Links. If a business needs help choosing or configuring Square, Stripe, PayPal, SumUp/Zettle, Worldpay or another provider, the business admin can submit an inline payment help request. The request is stored as a tenant-scoped contact enquiry and support email delivery is fail-soft, so the request is not lost if email is temporarily unavailable.

## Payment setup fulfilment UX

Provisioned subscriber sites now guide business owners through three payment setup choices: manual recording, MyExperiment.club-assisted setup, or existing provider setup. The help route creates a support/contact enquiry and notifies platform support when email is configured. Stripe Account Links stays separate from help requests and must complete Stripe-hosted onboarding before tenant online checkout can become available.
