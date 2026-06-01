# Subs Product Flow

## Current v1 flow
1. Homepage -> industry page -> demo page (customer/staff/admin views) -> setup order.
2. Customer starts setup and submits setup details.
3. Platform provisioning creates a clean subscriber site ready for real business data entry.

## Demo and preview clarity
- Demo pages now keep control panels compact and show a clear divider before preview content:
  - "Website preview starts here"
- Active/default draft switching remains available, but visual priority is on the website preview.
- Demo header includes `Get your site now` CTA on all demo routes, linking to `/setup/[industry]`.
- Demo wording avoids implying that demo data is copied into the live subscriber site by default.

## Appointment workflow (local mock)
- Shared appointment workflow currently covers:
  - `barbers`
  - `hairdressers`
  - `nail-salon`
  - `beauticians`
  - `massage`
  - `dog-grooming`
- Preferred time uses morning/afternoon/evening tile selection.
- Tiles are preference hints, not guaranteed live availability.
- When staff is selected, local rota and break windows can shape preferred slot suggestions.
- Local mock conflict checks can disable slots already tied to another local request for the same staff member/time.
- Dog grooming intake includes optional local pet details (name, breed, size, temperament notes).
- Appointment request flow now uses service tiles with visible service labels/pricing in demo forms to better mirror customer-facing live-site UX.

## Future appointment requirements (not implemented)
Real appointment slot availability will later require:
- logged-in customer profile prefill
- business opening hours
- staff rota / working days
- staff break windows
- service duration and buffers
- existing booking conflict checks
- admin setting for whether customers can select staff

## UI display consistency
- Shared labels/formatters live in:
  - `src/lib/ui/display-labels.ts`
- Shared customer-request badge lives in:
  - `src/components/requests/request-status-badge.tsx`

## Scope guardrails
This remains local/static/mock only.
No AWS resources, Stripe, real auth, real DB/API, or real external messaging/calendar integrations are implemented.
Current conflict checks are browser-local only and do not provide backend-grade locking/concurrency guarantees.

## Admin settings structure
`/admin/settings` is split into focused local sections (analytics, site settings, services, staff, availability, rota, closures, calendar preview, notifications) to avoid an unmanageable long page.

Calendar preview now includes:
- hourly staffing levels for a selected day
- 14-day staffing forecast cards
- an optional long-term day-grid view
- local bookings bars for quick demand comparison

## Date formatting
User-facing date displays are standardized to UK format (`dd/mm/yyyy` or `dd/mm/yyyy HH:mm`).

## Policy page placeholder
Each industry now has a standard policy placeholder route at `/<industry>/policy` covering payment options, cancellation/refund wording, and communication notes.

## Local CRM and notification-provider metadata
- `/admin/crm` includes a dedicated local CRM panel built from local request data.
- Notification templates include local provider metadata placeholders for a future Twilio sync path.
- No provider sync or message sending is implemented.



## Calendar Inspection (Local Mock)
- /admin/settings calendar preview now provides a 30-day day-tile inspection view.
- Admin can click a day to inspect staffing and request detail.
- Admin can inspect any custom date outside the visible 30-day window.
- This remains browser-local mock data only (no backend calendar sync, no conflict locking guarantees).



## Flexible job workflow (local mock)
- Window cleaning, cleaners, gardeners, and mobile valeting now use a shared flexible job/quote request flow.
- Requests capture address/location, preferred date/window, frequency, and optional access/property/vehicle/photo notes.
- Admin queue includes a flexible-job specific review block for these industries.

## Taxi workflow (local mock)
- Taxi/private-hire now uses a dedicated local quote/request intake flow.
- Requests capture journey type, pickup/destination, pickup timing, optional return timing, passenger/luggage, and airport/corporate/accessibility notes.
- Admin queue renders taxi-specific request detail for review and assignment.
- No maps, route pricing engine, dispatch integration, or backend persistence is implemented.


## Staff-assisted booking flow (local mock)
- Admin includes a staff-assisted booking panel for appointment industries.
- Intended use case: customer phones the business; staff creates booking on their behalf.
- Created booking stores local mock flags for registration/payment required and a mock completion link.
- UI shows a mock email preview only.
- No real account creation, password setup, payment collection, or email sending is implemented.

## Calendar preview UX (local mock)
- Calendar preview now defaults to a compact 7-day view with daily staffing/bookings bars.
- 30-day view is optional via explicit toggle.
- Clickable day tiles and inspect-date detail include hourly staffing and hourly bookings.

## Setup persistence transition (Task 4)
- Setup form now attempts backend persistence first via `/api/setup-requests`.
- If backend persistence is unavailable (missing `DATABASE_URL`, `503`, network failure), flow falls back to browser-local setup request creation.
- Confirmation page is source-aware and can resolve either backend-saved or local-saved setup requests.
- Auth is still not enabled; temporary route guard applies only to admin list/update endpoints.

## Setup queue visibility in hosted flow

Platform admins can now use `/admin/setup-requests` to view/update persisted setup requests.

Notes:
- Uses temporary admin email header until Auth.js is implemented.
- This queue is backend-only and is intentionally separate from local/mock setup request tooling.

## Persisted site provisioning step added

Flow now includes a persisted subscriber-site creation stage:
- setup request -> start site setup -> tenant site record + provisioning tasks.
- admin manages this in `/admin/sites`.

Still mock for infrastructure:
- no AWS provisioning actions, no live domain automation.

## Product flow refinement (persisted admin)

- Platform admin can move from persisted setup request to subscriber site in one step:
  - Start site setup -> open `/admin/sites?siteId=<id>`.
- `/admin/sites` now acts as the central provisioning workspace with:
  - grouped checklist tasks
  - domain/DNS manual tracking panel
  - subscription placeholder panel
  - site status timeline


## Product flow auth refinement

- Public prospect journey stays unauthenticated (industry/demo/setup submission).
- Platform admin journey now starts at `/admin/login`.
- Admin queues/pages and admin APIs are session-protected.
- Future milestones will split roles for business owner, staff, and end customer.

## Auth flow in product journey

- Prospect/customer journey remains public through demo/setup submission.
- Platform admin journey is now authenticated via `/admin/login`.
- Admin queues (`/admin/setup-requests`, `/admin/sites`, `/admin/settings`, `/admin/crm`, `/admin/sales`) are session-protected.
- Future milestones will add business-owner, staff, and customer role-specific auth.
- Hosted auth readiness can be checked safely via `/api/admin-auth-health` (booleans only, no secrets).

## Sales pipeline flow (platform outreach)

- A dedicated platform sales workflow now exists at `/admin/sales`.
- This is for prospective business leads before they become subscribers.
- Leads can be created manually or imported from CSV, then moved through outreach statuses.
- Admin can preview/copy standardized outreach email templates and mark leads as contacted.
- Sales pipeline now supports:
  - country/city location filtering
  - prepare email + copy + mark email sent
  - print letter/flyer and envelope per lead
  - bulk print batching (letters first, envelopes second)
- No real email provider sending is enabled yet.

## Platform vs site settings distinction

- `/admin/settings` is a business site settings demo for individual subscriber websites.
- Platform operations are managed in separate admin areas:
  - setup queue (`/admin/setup-requests`)
  - subscriber provisioning (`/admin/sites`)
  - sales pipeline (`/admin/sales`)
- `/admin/sites/[siteId]/settings` is a support/provisioning preview path and does not mean platform admin is the normal subscriber site operator.
- Future live model separates platform admin from business-owner operational admin.

## Platform admin navigation clarity

- `/admin` is the **Platform Admin Dashboard** for MyExperiment.club operations.
- Shared pill-style admin navigation is available across admin pages for consistent routing between dashboard, setup requests, subscriber sites, sales pipeline, and business-site settings demo.
- Dashboard sections are split as:
  - Platform operations: persisted setup requests, subscriber sites, sales pipeline, customer CRM.
  - Demo/site-owner tools: business site settings demo.
- `/admin/settings` route remains in place for compatibility, but is explicitly labeled as a subscriber/business-owner settings preview and may move later to a subscriber-scoped settings route.
- Site-scoped settings entry now exists via subscriber records:
  - `/admin/sites/[siteId]/settings`
  - used as the contextual path for business-site settings in provisioning flow.

## Demo to setup sales journey polish

- Homepage industry cards now use `View demo site` wording.
- Clicking homepage `View demo site` opens `/demo/<industry>` in a new tab/window while current tab moves to `/<industry>`.
- Industry and demo CTA wording now standardizes around `View demo site`, `Create my own site`, and `Start setup`.
- Demo control area no longer exposes a `View default template demo` customer toggle.
- Customisation stage is now guided onboarding:
  - core business details first
  - clear checklist of what can be customised later
  - fast setup templates for services/staff (CSV template download + local preview upload)
  - explicit next-stage messaging to continue setup (`/setup/<industry>`)

## Demo/live-site realism additions
- Appointment-led demos now prioritize tile-based service selection with pricing labels before scheduling fields.
- Demo preview includes planned portal-layer placeholders:
  - Customer login
  - Staff login
  - Business admin login
- Appointment-style demos now show a planned Gift Vouchers section with delivery-method options and local/mock disclaimer.

## Subscriber site route split (demo model)
- Customer-facing site home remains at `/demo/[industry]`.
- Booking is now a dedicated route: `/demo/[industry]/booking`.
- Customer account route: `/demo/[industry]/account`.
- Staff operations route: `/demo/[industry]/staff`.
- Business owner admin route: `/demo/[industry]/admin`.
- About/Contact page routes: `/demo/[industry]/about` and `/demo/[industry]/contact`.

## Demo booking polish (local mock)
- Appointment booking now starts with 14 upcoming open-day tiles before time selection.
- Day tiles use availability color cues: green (high), orange (limited), red (under 5), grey (fully booked/disabled).
- Booking copy is customer-facing and avoids internal request/debug terminology.
- Customer profile details from /demo/[industry]/account prefill booking name/email/phone fields.
- Business admin demo updates (services/staff/rota/closures) feed local booking availability behavior.


## Demo business admin/staff controls polish
- Manual staff bookings now include local payment status selection and display.
- Business admin demo now supports add/remove for services and staff.
- Staff available weekdays now control rota eligibility in the local editor.


## Business admin compact controls
- /demo/[industry]/admin now uses compact service and staff cards to reduce long-scroll editing.
- Staff role/position options are business-defined and reused in staff dropdown selection.


## Additional demo business controls
- Service cards now use explicit input labels for editing clarity.
- Voucher delivery options are now shown as Email, Collect in store, Post.
- Postal voucher delivery now captures a dedicated voucher delivery address in local mock flows.
- Staff can optionally assign a team member when creating manual bookings.

## Homepage and booking UX refresh
- Homepage now leads with value-first messaging for managed websites plus booking/request tools.
- Industry selection is category-first (reveal by category), rather than showing all industries at once.
- Category order is Hair, Beauty & Wellness -> Home Services -> Transport -> Learning.
- Public pricing/copy removes WhatsApp add-on sales messaging.
- Business admin now uses collapsible accordion sections for cleaner navigation.
- Appointments settings include slot interval control (`15/30/60`) and customer staff-selection toggle.
- Booking UI supports interval-specific display:
  - 60 min: hourly slots
  - 30 min: half-hour slots
  - 15 min: hour tiles first, then quarter-hour options within selected hour
- Booking submissions now create a local/mock auto-response email event log entry.

## Industry coverage update
- Launch coverage now includes 14 industries:
  - taxi, bus-hire
  - barbers, hairdressers, beauticians, nail-salon, massage, dog-grooming
  - window-cleaning, cleaners, gardeners, mobile-valeting
  - driving-instructors, tutors


## Homepage conversion polish (2026-05)
- Hero CTA contrast updated for stronger readability: primary action uses a dark filled button and secondary actions use high-contrast light buttons with dark text.
- Value section now leads with a wide `Business tools included` tile above supporting value tiles.
- Pricing domain tile now explicitly states domain service is optional: only charged when domain registration/management is provided.
- Homepage FAQ replaced with the longer conversion-focused list covering package scope, domains, previews before payment, branding fallback, hosting responsibility, bookings, staffing, vouchers, and manual bookings.
- Homepage hero CTA readability updated so `View example demo` and `How it works` match high-contrast button treatment.
- Homepage trust/value copy updated:
  - `More than just a website. A complete toolkit for your business.`
  - lead tile title now `Includes ALL business tools`
  - `Managed setup and hosting` and `Fast launch` copy refreshed
  - `One simple package` tile replaced with `Customer communication`
- Pricing copy updated:
  - intro now emphasizes no expensive tiers and one recurring monthly fee
  - domain tile explicitly states optional charge only when a new domain registration is needed
  - go-live helper wording now references confirmed domain name
- How-it-works steps now follow:
  1. Choose your business type
  2. View the demo
  3. Place order (with domain details)
  4. Your site is built
  5. Customise look/feel, services, pricing, and staff
- New FAQ entries:
  - `What if I get stuck?`
  - `How do payment processors work?`
- Demo business admin payments section now includes payment processor setup intent options (existing processor / need help / manual recording) with notes, local mock only.
- Public positioning remains simple-package and avoids WhatsApp/expense-tracking launch claims.

## Demo login separation and navigation clarity (2026-05)
- Demo site routes now keep platform admin separate from subscriber site login areas.
- On `/demo/*` routes, global platform header/footer chrome is hidden so prospects are not pushed into MyExperiment.club platform admin login by mistake.
- Demo nav labels are now explicit:
  - Customer View
  - Staff View
  - Admin View
- Demo access credentials cards have been removed from demo customer/admin/staff pages to avoid fake-login clutter in the public preview.

## Demo readability and admin-controls fixes (2026-05)
- Demo nav/menu pill styles were hardened with explicit high-contrast classes for dark-hero usage.
- Active nav item now uses a dark background with white text.
- Service/staff summary separators were normalized to safe ` - ` formatting to avoid hosted mojibake display issues.
- Ad hoc closure creation now checks same-day local bookings:
  - if none: `No appointments found for this closure date.`
  - if found: warning plus affected appointment list (time, customer, service, assigned staff, payment status)
- Page visibility/content now includes editable About and Contact content blocks (title/body/image placement/CTA + contact/map text placeholders).
- Payments/sales helper copy updated to include finance reporting context.
- Business branding controls now expose explicit `Remove logo` and `Remove favicon` actions.

## Subscriber site themes (local mock)`r`nBusiness admin now controls subscriber site style through a curated Theme + Palette system:`r`n- Themes: Modern Minimalist, Vintage Classic, Urban Hipster, Luxury Elegant, Rustic Warm`r`n- Each theme has 3 curated palettes; there is no unlimited colour picker in launch mode.`r`n- Theme controls visual personality and layout feel while feature scope remains consistent.`r`n- Changes made in `/demo/[industry]/admin` propagate to customer-facing `/demo/[industry]` immediately via local settings.`r`n- Legacy saved IDs from older template/scheme names are mapped automatically.`r`n- Themes are intentionally designed to look strong without requiring business photo uploads.`r`n`r`n## CSV tooling location update
CSV import/export setup tools moved out of demo customisation and into business admin (`Import/export setup data`) for services and staff.

## Demo booking/account/policy polish (2026-05)
- Demo site nav active-state contrast hardened to keep selected pill readable.
- Demo nav labels updated to `Customer View`, `Staff View`, and `Admin View`.
- Site-scoped demo pages now share a consistent top demo header using a reusable shell component.
- Booking submit label updated to `Book Appointment`.
- Booking confirmation now renders beside submit area and links to `/demo/[industry]/account?tab=bookings`.
- Customer View now includes local cancellation action for upcoming bookings.
- Cancellation/refund policy settings added to business admin (`Policies` section), local/mock only.
- New demo policy route: `/demo/[industry]/policy`, using business name + policy settings.
- No real payment/refund processing is implemented in this phase.


## Demo content controls update (local/mock)
- Social links are now rendered inside the customer-facing Contact and opening hours tile on /demo/[industry] rather than a separate Follow us tile.
- Gift vouchers homepage card is simplified to a direct customer CTA (Buy gift voucher) and reflects admin-enabled delivery methods (Email, Collect in store, Post).
- About page now supports two admin-configurable modes:
  - GENERAL (text + two image placeholders)
  - STAFF_PROFILES (profile cards with name/role/bio/image placeholder)
- Contact page now supports a Google Maps search link derived from business address (no API key integration).
- Policy page now supports admin visibility toggle and editable policy title/body content in addition to cancellation/refund rules.
- All of the above remains browser-local mock state only in this phase.

## Demo nav/account and payment-setup corrections (local/mock)
- Demo nav button states now use explicit active/inactive class helpers for reliable readability across themes.
- Shared demo intro/sell header is now standardized across all /demo/[industry] routes via common intro + shell usage.
- Customer View concept is now site-scoped:
  - public customer site remains /demo/[industry]`r
  - account/bookings area remains /demo/[industry]/account for upcoming/history/cancel actions.
- Booking confirmation continues to link to site-scoped customer account (/demo/[industry]/account?tab=bookings).
- Services CSV template now matches service editor fields: serviceName, basePrice, durationMinutes, bufferAfterMinutes, description (+ optional rolePrice columns).
- Contact page is now standard and always visible; About/Policy remain optional buildable pages.
- Payments/sales section now captures payment setup intent with provider selection/instructions (no real processor integration).

## Demo nav and account tidy (local/mock)
- Demo nav now uses: Home, My Account, Staff View, Admin View, About us, Contact, Policy.
- Bookings and Customer View links were removed from top demo nav.
- My Account route (/demo/[industry]/account) now focuses on:
  - contact details (local edit/save)
  - upcoming appointments (with cancel action)
  - completed/cancelled booking history.
- Booking confirmation link now reads View in My Account and stays site-scoped.

## Public slug route and booking flow (v1 proof)
- Added customer-facing slug route: `/sites/[siteSlug]`.
- Added customer-facing booking route: `/sites/[siteSlug]/booking`.
- Added public booking API: `POST /api/sites/[siteSlug]/bookings`.
- Tenant is resolved server-side by slug; no client `tenantSiteId` trust.
- Custom domain host routing is still a separate upcoming milestone.
- No payment/email/auth automation added in this pass.

## Public tenant route + domain readiness
- Public tenant route now has two forms:
  - slug route: `/sites/[siteSlug]` (active fallback/proof route)
  - future host route: custom domain host -> `SiteDomain` -> `TenantSite` (prepared, not switched on yet)
- Public booking route/API are tenant-resolved by slug or server-side host-resolution paths; client never submits arbitrary tenant ids.
- Platform admin `/admin/sites` now includes a domain-resolution test utility to validate mappings before custom-domain rollout.

## Payment setup flow (persisted intent only)
- Business owner configures payment setup intent from site-admin:
  - existing processor, need help, or manual-only recording.
- Business owner sets accepted methods and booking prepayment preference.
- Cancellation/refund timing is stored for policy messaging.
- This phase does not include real provider integration, checkout, or charge capture.

## Customer-facing social links
- Social media links are displayed in the `Contact and opening hours` tile.
- Icon buttons are used instead of text-only links.
- Website links are not part of the social list.

## Subscriber pages/content and social settings
- Public tenant sites now read persisted page/content/social settings from `CustomerSiteSettings`.
- Contact is standard and always available.
- About and Policy are optional and controlled per tenant site.
- Social links are persisted and rendered with static icon assets (Facebook, Instagram, TikTok, X/Twitter, LinkedIn, YouTube).
- No external social integrations are added in this pass.

## P0 conversion path cleanup (2026-05-26)
- `/demo/[industry]/customise` is now a lightweight transition/help page instead of the main customisation experience.
- Primary customization path is demo Admin View (`/demo/[industry]/admin`).
- Core conversion CTAs are standardized to:
  - `View demo site`
  - `Get your site now`
  - `Submit setup request`
- Setup flow messaging now states that payment/subscription onboarding is confirmed after setup request submission.
- Public-facing copy has been tightened to avoid mock/local technical wording in conversion surfaces.
- Global `/account` is no longer promoted in public header/footer navigation; site-scoped account flows remain under demo routes.

## Setup confirmation security update (2026-05)
- Setup confirmation now uses signed-style secret token verification (`requestId + token`) for public confirmation reads.
- Request ID alone no longer grants public access to setup-request detail.
- Token plaintext is generated at create-time only; backend stores hash and usage timestamps/count.
- Platform admin setup-request management remains session-protected.
- Local browser fallback remains available for backend-unavailable setup submissions.

## Contact/support flow update
- Public support route: `/contact`.
- Form submits to `POST /api/contact-enquiries` and stores persisted enquiry records when backend is available.
- If backend persistence is unavailable, the UI returns a clear error and asks users to retry.
- Platform admin triage route: `/admin/contact-enquiries` with status workflow: NEW -> REVIEWED -> REPLIED -> CLOSED.
- No real email sending is included in this pass.

## Setup order and payment clarity (2026-05-26)
- Setup is an order-intent flow, not live checkout.
- Setup page summary now states:
  - Website setup: £149 one-time
  - Monthly subscription: £30/month
  - Domain service: £49 only when we register/manage a new domain
  - Existing domain: no domain service charge when customer can point DNS/nameservers
- Setup flow messaging now confirms:
  - payment/subscription setup is handled during onboarding after request submission
  - no payment is taken at request submission in the current phase
- Domain choices are now presented as:
  - I already own a domain
  - I need a new domain
  - I am not sure yet
- Platform admin setup queue now includes a commercial-status panel for manual payment/domain follow-up actions.

## Transactional email foundation (2026-05-26)
- Added first real transactional email provider foundation using Resend.
- Email is fail-soft:
  - if env is missing, APIs continue and return safe skipped status (`EMAIL_NOT_CONFIGURED`)
  - provider failures do not block contact/setup/booking record creation
- Current transactional scope:
  - contact enquiry notification to platform admin
  - setup request confirmation to prospect
  - setup request notification to platform admin
  - persisted tenant booking confirmation to customer
- Not included in this phase:
  - bulk marketing sends
  - unsubscribe/newsletter system
  - Twilio/WhatsApp delivery
  - payment/checkout emails
  - attachments

## 2026-05-30 update: conversion surface polish
- Demo/public homepage hero no longer includes a generic booking CTA button.
- Booking actions remain service-specific in service cards and booking routes.
- Subscriber-facing appearance choice is simplified to `Light`/`Dark` for launch quality control.
- Advanced theme/palette mappings remain internal for compatibility and future controlled rollout.

## 2026-05-30 operations polish update
- Demo gift voucher CTA now links to `/demo/[industry]/vouchers` (voucher purchase flow) instead of My Account.
- Voucher checkout remains local/demo only and does not process real payments.
- Demo Admin View now defaults to `Bookings` and shows a 3-column dashboard: Cancellations, Today, Future.
- Staff View now shows a clear red `Cancelled` status badge for cancelled appointments.

## 2026-05-30 order flow polish update
- Homepage hero CTA row now uses:
  - `Choose your business type`
  - `View example demo`
  - `Order now`
- `/setup/[industry]` is now presented as a simpler order-start flow.
- Step 1 now lets users confirm/change website type before entering order details.
- Setup page removed extra explainer blocks so the path is focused on placing an order.
- Setup form submit wording is now `Order now` (loading: `Placing order...`).
- Order summary copy is simplified and keeps payment/domain confirmation as the next onboarding step.
- Internal persistence still uses `SetupRequest`, and confirmation access remains token-hardened.

## 2026-05-30 recurring and block-booking foundations
- Homepage hero CTA row keeps `Order now` as the third primary action.
- Combined value/pricing section now keeps pricing card clean while `Choose your business type` and `View example demo` CTAs sit under the value column.
- Industry marketing bullets were refreshed:
  - Hairdresser: `Gift Vouchers`
  - Gardeners: `Recurring payments available`
  - Bus Hire and Tutor bullets simplified for conversion clarity.
- Business admin foundations added for recurring/block booking controls:
  - site-level recurring enable
  - site-level customer block bookings enable
  - per-service recurring enable + interval selection (`WEEKLY`, `MONTHLY`, `ANNUALLY`)
  - per-service block booking enable + suggested block counts
- Public/demo service cards now show `Recurring available` and `Block bookings available` badges when enabled.
- Recurring payment issue reporting is a placeholder panel in this pass; no real provider sync exists yet.

## 2026-05-30 Stripe checkout foundation
- Order flow can now start Stripe Checkout after setup request creation when Stripe env vars are configured.
- Checkout line items include: setup fee (one-off), monthly subscription, and optional domain service fee when we manage registration.
- Payment is confirmed only by Stripe webhook events; no card details are stored in app data.
- If Stripe is not configured, the flow falls back to manual onboarding payment confirmation messaging.

## 2026-05-30 platform admin dashboard refocus
- /admin now acts as a platform operations dashboard instead of a demo/business-owner workspace.
- Main tiles are report selectors: Order Requests, Subscriber Sites, Payment Fails, Sales Pipeline, Contact Enquiries, Revenue by Industry.
- Payment Fails and Revenue by Industry use real persisted platform data where available and show honest placeholders when Stripe/webhook data is not yet populated.

## 2026-05-30 industry sales journey polish
- Homepage View example demo now scrolls to #industries so visitors choose the most relevant demo by business type.
- Industry pages are now a focused sales step between homepage and demo/order, with stakeholder journey messaging for customer, business owner/manager and staff.
- Repeated homepage pricing/package block and weak default-services demo block were removed from industry pages.

## 2026-05-30 sales pipeline expansion
- /admin/sales now supports downloadable CSV templates, extended lead-source fields, duplicate-review import decisions, and campaign preparation workflows.
- Campaign levels are now defined as Launch offer, Introduction, and Reminder with preview-only email copy in this phase.
- Bulk live sending is intentionally disabled; this pass focuses on prospect data quality, segmentation and compliance readiness.

## Stripe Checkout hosted verification notes (2026-05-31)
- Checkout API: `/api/setup-requests/[id]/checkout` (requires setup confirmation token or platform-admin session).
- Payment status is trusted from Stripe webhooks, not frontend redirect state.
- Webhook endpoint: `https://myexperiment.club/api/stripe/webhook`
- Subscribe Stripe webhook events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

## Contact/support and checkout diagnostics update (2026-05-31)
- Platform admin contact queue now opens with `NEW` enquiries by default for faster triage.
- Stripe health endpoint (`/api/stripe/health`) now includes safe config-shape checks and warnings.
- Stripe price env vars must be Stripe Price IDs (`price_...`), not raw amounts.
- Full Stripe checkout config requires `STRIPE_PRICE_DOMAIN_SERVICE`.
- Email health endpoint now warns when `EMAIL_FROM` is not from verified `myexperiment.club` sender domain.

## 2026-05-31 post-payment confirmation copy polish
- `/setup/confirmation` now uses customer-friendly website type labels (for example `Barber website`) instead of raw slug values.
- In paid/success states, summary wording switches to `Paid today`; unpaid/cancelled states still use payable wording.
- The next-steps panel is now phrased as MyExperiment.club actions (`What we do next`) for clearer reassurance after checkout.

## 2026-06-01 setup queue and confirmation polish
- Platform admin can now remove cancelled setup orders from `/admin/setup-requests` using a cancelled-only queue cleanup action.
- Queue cleanup is soft-archive based (`archivedAt`) so active queue views stay focused without deleting Stripe/customer history.
- Post-checkout confirmation now uses domain-option-aware `Next Steps` messaging.
- Webhook/payment confirmation state is surfaced in setup-request admin detail using payment status plus completion timestamp.

## 2026-05-31 order-to-checkout flow update
- `/setup/[industry]` now starts Stripe Checkout immediately after backend order creation when Stripe is configured.
- Confirmation route is now treated as post-checkout and next-steps focused, with a retry-payment path when checkout is cancelled.
- Setup order summary now emphasizes payable-today and monthly subscription amounts.
- Card details remain handled by Stripe Checkout only; webhook remains source of truth for paid status.
