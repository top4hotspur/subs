# Subs Business Owner Admin Model (Planned)

## Purpose
Define the intended operational ownership model for subscriber sites, separate from platform admin operations.

## Ownership split
- Platform admin (MyExperiment.club team):
  - setup requests
  - subscriber provisioning status
  - domain/subscription tracking
  - support visibility
- Business owner admin (subscriber):
  - services/pricing
  - staff/users/permissions
  - rota/breaks/holidays
  - bookings/customers
  - vouchers
  - pages/content
  - notifications
  - financial reporting

## Login layers (planned)
- Customer login:
  - bookings/history
  - profile
  - voucher usage visibility
- Staff login:
  - appointment list
  - telephone/manual booking
  - voucher check and redeem
- Business admin login:
  - full business operational controls

## User and permission model (planned)
Business admin can:
- create users/staff logins
- grant super-user status
- assign area permissions:
  - bookings
  - staff
  - rota
  - services/prices
  - financials
  - vouchers
  - pages/content
  - notifications
  - reports

## Gift voucher operations (planned)
- Admin can enable/disable vouchers.
- Voucher delivery methods:
  - digital email
  - collect in store
  - post (with postage charge)
- Staff can:
  - check voucher code
  - mark redeemed/used
  - record redemption details (time/staff/request context)

## Current implementation status
- This model is documented only.
- Current app remains local/mock for these role-specific subscriber operations.
- Platform admin routes should not be treated as the final business-owner operational portal.
- Demo route references for this model:
  - `/demo/[industry]/account`
  - `/demo/[industry]/staff`
  - `/demo/[industry]/admin`

## Current demo controls
- Business admin demo includes editable service naming/description/pricing, staff details, rota, and closure management.
- Role-level service pricing overrides can drive customer-facing From £x price labels.


## Demo operational controls update
- Staff manual bookings now capture local payment status (Payment Completed / Requires Payment).
- Business admin can add/remove services and add/remove staff in local demo mode.
- Staff records now include available working weekdays and a super-user toggle.
- Rota editor enforces weekday availability by disabling non-available days.
- Voucher settings now show explicit currency labels for value ranges and postage.


## Compact business-admin UX (demo)
- Services are now managed as compact cards with expand/collapse editing.
- Service cards include duration minutes and buffer-after values used by booking slot suggestions.
- Staff position uses a dropdown populated from business-created positions.
- Staff is managed in compact cards with day-availability summary and expandable details.


## Social, currency, and in-store controls (demo)
- Business admin can configure social profile links and enabled platforms.
- Site currency can be set to GBP/EUR/USD for local display formatting.
- Staff manual booking supports optional assigned staff.
- In-store payment recording can be enabled/disabled per site; enabled state exposes a staff sales recorder.


## Business admin layout refresh (demo)
- Core sections are now collapsible to reduce long scrolling:
  - Business settings
  - Staff positions
  - Services and prices
  - Staff
  - Appointments
  - Rota and breaks
  - Ad hoc closures
  - Gift vouchers
  - Page visibility/content
  - Payments/sales
  - Super-user permissions
- Appointments section includes slot interval and customer staff-selection controls.

## Branding fallback model (demo)
- Business owner mock now supports text-brand fallback plus optional local logo/favicon preview uploads.
- Customer-facing demo brand area uses uploaded logo when available.
- If no logo is set, the site falls back to text branding using the configured business/site display name.
- Media is local-preview only and not persisted to a production media pipeline in this phase.

## Demo access details (preview-only)
Business-owner/staff/customer mock routes now display demo credential guidance for hosted reviews:
- Customer: demo.customer@example.com / demo123
- Staff: demo.staff@example.com / demo123
- Business admin: demo.admin@example.com / demo123

Important:
- These are non-production preview credentials.
- Platform admin credentials/access code are not shown in demo-site portal UI.

## Business admin demo updates (local/mock)
- Ad hoc closures now include a pre-close conflict check against local appointments and display impacted bookings when present.
- Page visibility/content section now supports direct editing for About and Contact pages:
  - title
  - body text
  - image placement (none/above/beside)
  - placeholder image/url field
  - optional CTA label/link
  - contact details text and map placeholder text for Contact page
- Branding controls include explicit remove actions for local logo/favicon previews.
- Payments/sales helper text now clarifies local in-store recording supports finance reporting accuracy.

## Business admin setup tools
- New `Site design` section allows subscriber business owners to choose visual template + colour scheme.
- New `Import/export setup data` section includes:
  - Download services CSV template
  - Upload services CSV
  - Download staff CSV template
  - Upload staff CSV
- CSV imports update local demo services/staff state only.

## Site design controls (local mock)`r`n- Business admin `Site design` now uses a controlled Theme + Colour palette model.`r`n- Themes: Modern Minimalist, Vintage Classic, Urban Hipster, Luxury Elegant, Rustic Warm.`r`n- Each theme exposes exactly 3 curated palettes; palette options are filtered by selected theme.`r`n- Theme/palette changes persist immediately in local browser settings and propagate to `/demo/[industry]`.`r`n- Backward mapping is applied for old template/colour IDs already stored in local settings.`r`n- No required image uploads: themes are designed to look professional through layout, cards, typography, and colour tokens.`r`n`r`n## Payment processor setup intent (local mock)
- Demo business admin now includes setup choices:
  - Existing processor
  - Need help setting one up
  - Manual recording only for now
- Existing processor name and setup notes can be captured locally.
- This is configuration intent only and does not connect Stripe/Square/PayPal APIs in this phase.

## Demo navigation and preview cleanup (local mock)
- Demo navigation labels are now `Customer View`, `Staff View`, and `Admin View`.
- Demo access credential cards were removed from demo customer/staff/admin pages.
- Business admin now includes hero headline editing for the customer-facing demo homepage.
- `Open customer site preview` opens a new tab for faster side-by-side template checks.

## Demo policy controls (local mock)
- Business admin now includes a `Policies` section with:
  - cancellation enabled toggle
  - full refund notice days (1-5)
  - no refund within days (same day or 1-5 days)
  - optional custom policy note
- Customer View displays a policy note with cancellation/refund timing.
- Demo policy page reflects business policy settings and business name.


## Page content and visibility controls (local/mock)
- Business admin can now manage About/Contact/Policy visibility and content in the demo settings area.
- About page modes:
  - GENERAL: editable title/body + two image placeholder fields + placement options.
  - STAFF_PROFILES: editable profile blocks (name, role, bio, image placeholder/url).
- Contact page includes optional Show Google Maps link from business address behavior (link-only, no API).
- Policy page includes editable title/body plus existing cancellation/refund settings.

## Business admin page-builder wording and page rules
- Contact page is treated as a standard always-on page in demo model.
- About and Policy pages remain optional via visibility toggles.
- Admin wording for page buttons now uses business-friendly terms (Button text, Button destination) instead of CTA jargon.
- Payment setup now supports explicit provider intent capture and setup instructions without connecting provider APIs.

## Admin view layout refinement (local/mock)
- Business admin demo now opens settings via a tile selector grid (up to 4 columns on desktop).
- Clicking a section tile renders that section panel underneath the grid.
- Existing section content and local state behavior are preserved; sections are no longer presented as one long always-visible vertical list.

## Persisted settings bridge (current milestone)
- A narrow persisted model now exists for subscriber sites:
  - CustomerSiteSettings
  - CustomerSiteService
- Current persisted editor is platform-admin support/provisioning only (`/admin/sites/[siteId]/settings`).
- Future subscriber business-admin auth/portal should assume ownership of these persisted records.
- Other business-admin modules remain local/mock until later milestones.

## Persisted staff bridge (current milestone)
- Added tenant-scoped persisted entities:
  - CustomerSiteStaffRole
  - CustomerSiteStaffMember
- Persisted staff editor is now available in platform-admin support route `/admin/sites/[siteId]/settings`.
- Rota/breaks/holidays remain local/mock and are the next persistence milestone.

## Persisted scheduling bridge (current milestone)
- Added persisted scheduling entities for subscriber sites:
  - rota days
  - break windows
  - business closures
  - staff holidays
- Current persisted editor is available via platform-admin support route `/admin/sites/[siteId]/settings`.
- Rota/break logic is now storable in backend, but live customer booking enforcement remains a next-step integration.

## Business-owner login foundation (v1)
- Added persisted business-owner/admin user model:
  - `CustomerSiteAdminUser`
- Platform admin can bootstrap business-owner access per tenant site from:
  - `/admin/sites/[siteId]/settings` -> `Business owner access`
- Bootstrap fields:
  - email
  - display name
  - role (`OWNER`/`ADMIN`)
  - invitation status (`INVITED`/`ACTIVE`)
  - active flag
- Temporary access code is generated and shown once in UI; only hashed value is stored.
- Subscriber business-owner login route:
  - `/site-admin/login`
- Subscriber business-owner area:
  - `/site-admin/[siteSlug]`
- First editable scope in this pass:
  - persisted site settings
  - persisted services
- Not included yet:
  - staff/customer auth
  - invite email sending
  - full tenant business-admin parity with all persisted modules

## Site-admin staff and scheduling scope (tenant-scoped)
- `/site-admin/[siteSlug]` now includes section-based management for:
  - Staff & roles
  - Rota & breaks
  - Closures & holidays
  - Bookings summary (read-only)
- Site-admin API routes are tenant-scoped by slug and session:
  - `GET/PUT /api/site-admin/[siteSlug]/staff-roles`
  - `GET/PUT /api/site-admin/[siteSlug]/staff`
  - `GET/PUT /api/site-admin/[siteSlug]/scheduling`
  - `GET /api/site-admin/[siteSlug]/bookings`
- Security rule: session tenant must match slug-resolved TenantSite; cross-tenant access is denied.
- Staff and customer auth are still out of scope in this milestone.

## Business owner branding controls (persisted)
- Site-admin `Site settings` now includes persisted branding controls:
  - Upload logo
  - Remove logo
  - Upload favicon
  - Remove favicon
- Guidance shown in UI:
  - Logo: PNG/SVG recommended, max 1MB
  - Favicon: PNG/ICO recommended, max 512KB
- These controls write real tenant-scoped media metadata and no longer rely on local-only preview as source of truth.

## Business-owner payment setup (persisted)
- Site-admin (`/site-admin/[siteSlug]`) now includes a persisted `Payments and policies` panel.
- Business owner can set:
  - payment setup mode
  - preferred provider
  - non-secret account reference/notes
  - accepted payment methods (cash/card)
  - prepayment preference
  - in-store payment recording toggle
  - cancellation/refund timing and policy note
- Copy explicitly warns not to enter API keys or passwords.
- This does not connect any provider in this milestone.

## Social link icon behavior
- Social links in customer-facing demo pages are rendered as icon buttons from local static assets.
- Icons are served from `public/icons/social` and mapped via `src/lib/sites/social-platforms.ts`.
- No external social API integrations are used.

## Site-admin content controls (persisted)
- `/site-admin/[siteSlug]` now includes persisted:
  - About page toggle and content fields.
  - Contact page title/intro/map note/map link toggle (Contact remains standard and visible).
  - Policy page toggle and content fields.
  - Social media toggles + profile URLs for Facebook, Instagram, TikTok, X/Twitter, LinkedIn and YouTube.
- These values update tenant-scoped `CustomerSiteSettings` and are used by `/sites/[siteSlug]` public routes.
- No real About/Contact image upload is added in this pass; placeholder URL fields only.

## 2026-05-30 update: business owner launch UX
- Site-admin launch UI now presents a controlled `Site appearance` choice (`Light` or `Dark`) instead of the full theme/palette matrix.
- This keeps customer-facing sites visually consistent while preserving internal theme/palette data compatibility.
- Branding and social controls remain available; social icons display as clean platform icons in customer-facing contact areas.

## 2026-05-30 booking operations update
- Demo admin booking operations are now the default landing section in Admin View.
- Bookings dashboard columns:
  - Cancellations (with local refund-required/refund-complete tracking)
  - Today
  - Future
- Refund handling remains manual through the external payment provider.

## Recurring and block-booking controls (foundation)
- Site-admin now includes configuration-only controls for recurring service/payment options.
- Site-admin can enable recurring options site-wide, then mark individual services as recurring-capable.
- Supported recurring intervals in this pass: WEEKLY, MONTHLY, ANNUALLY.
- Site-admin can enable customer block bookings site-wide and per service.
- Per-service suggested block counts can be stored as guidance (for example 5, 10, 12).
- No live recurring billing integration is connected yet.

## Recurring payment issues placeholder
- Site-admin and support/admin editors include a Recurring payment issues placeholder area.
- Current behavior is informational only (No failed recurring payments to review.).
- Real failed-payment ingestion and resolve workflows depend on future provider integration.

## 2026-05-30 update: settings visibility and ordering polish
- `/site-admin/[siteSlug]` now defaults to `Bookings` so operational data is visible first.
- `Site appearance` is now a dedicated top-level section in site-admin so Light/Dark is easy to find.
- Launch appearance remains Light/Dark only for subscriber users; advanced theme/palette internals remain hidden.
- Section order now surfaces key controls first: bookings, business settings, site appearance, services/prices, staff, rota/breaks, and closures/holidays.
- Payment setup, recurring/block-booking controls, and branding uploads remain in business-admin with tenant-scoped persistence.

## 2026-05-31 business-owner appearance behavior
- Site-admin appearance control remains Light/Dark only and maps to controlled internal defaults.
- Legacy theme selections are not exposed to business owners and are ignored by public rendering.
- Existing persisted fields remain intact for compatibility.

## Future Subscriber Payment Provider Model

- Subscriber businesses will eventually need to connect their own payment processor for customer bookings and payments.
- Business-admin payment setup should be conditional by provider and integration method rather than exposing one generic set of API fields.
- Planned provider families to consider include Stripe, Square, PayPal, SumUp, Zettle, and more on request where practical.
- The future business-owner experience should provide provider-specific setup guidance, safe onboarding steps, test/live status, webhook verification status, refund handling notes, and payment-status diagnostics.
- Secure credential handling is a prerequisite. Secrets must not be stored in normal visible settings, returned through public APIs, exposed in UI, or written to logs.
- Current behaviour remains intentionally conservative: payment settings capture preferences and policy wording, while live provider connection beyond the existing controlled foundations is future work.
