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
- Sales pipeline workflow now supports:
  - provider cost auto-fill (editable) for known providers
  - persisted campaign template editing (Email 1, Email 2, Snail mail)
  - candidate checkbox selection with eligibility/suppression reasons
  - selected-only manual sent tracking (lastContactedAt, lastCampaignStep, contact events)
  - unsubscribe terminal suppression flow via `/unsubscribe/sales?token=...`
- Suppression rules exclude: `UNSUBSCRIBED`, `DO_NOT_CONTACT`, `BOUNCED`, `CONVERTED`, snoozed leads, and leads missing required channel data (e.g., no email for email campaigns).
- Live bulk email sending remains disabled in this phase.
- Campaign levels are now defined as Launch offer, Introduction, and Reminder with preview-only email copy in this phase.
- Bulk live sending is intentionally disabled; this pass focuses on prospect data quality, segmentation and compliance readiness.

## 2026-06-01 sales campaign template quality update
- Sales templates now lead with the full MyExperiment.club offer (managed website + business operations tooling), not only booking/cost language.
- New template token usage includes:
  - `{{contactFirstName}}`, `{{contactLastName}}`, `{{contactName}}`
  - `{{landingPageLink}}` as primary campaign destination
  - `{{demoLink}}` as secondary proof path
- Snail-mail letter preview now includes a QR code for the landing page link.
- Live bulk sending remains disabled.

## 2026-06-01 controlled campaign dispatch
- Platform admin sales now supports controlled selected-email dispatch from `/admin/sales`.
- Sending is limited to selected eligible leads and re-validated server-side.
- Suppressed leads (`UNSUBSCRIBED`, `DO_NOT_CONTACT`, `BOUNCED`, `CONVERTED`), snoozed leads, invalid/no-email leads, and already-contacted step leads are skipped.
- Manual sent tracking remains available for external/manual sends.
- Sales lead cleanup actions are now available for test/spam leads (with stronger confirmation for history/converted records).

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

## 2026-06-01 paid setup request fulfilment flow
- Fulfilment path is now:
  - paid setup request -> platform admin clicks `Create blank subscriber site` -> clean tenant site is provisioned.
- Provisioning action is visible only for paid, non-cancelled, non-archived requests.
- After provisioning, admin gets direct links to:
  - subscriber public site (`/sites/[siteSlug]`)
  - subscriber admin area (`/site-admin/[siteSlug]`).
- Provisioning is idempotent and reuses existing site records when already created.
- `/sites/[siteSlug]` remains a platform preview/dev route for now.
- Production destination remains the customer's own domain once host/domain routing is enabled.

## 2026-06-01 subscriber onboarding shell
- After paid provisioning, business owners now continue setup in `/site-admin/[siteSlug]`.
- The subscriber admin shell surfaces a setup checklist and onboarding cards before detailed editing.
- Checklist/status uses tenant data and explicit `Not set yet` empty states (no demo/localStorage seed data).

## 2026-06-01 public shell + business settings reflection
- Public tenant shell (`/sites/[siteSlug]`) is now positioned as customer-facing with cleaner nav and footer policy/login links.
- Policy/Cookie/Privacy links live in the footer.
- Business-owner onboarding focuses first on Business details + site content/settings in `/site-admin/[siteSlug]`.
- Updates to business details (name/email/phone/address/opening hours/about/contact intro) now reflect directly on `/sites/[siteSlug]`.

## 2026-05-31 order-to-checkout flow update
- `/setup/[industry]` now starts Stripe Checkout immediately after backend order creation when Stripe is configured.
- Confirmation route is now treated as post-checkout and next-steps focused, with a retry-payment path when checkout is cancelled.
- Setup order summary now emphasizes payable-today and monthly subscription amounts.
- Card details remain handled by Stripe Checkout only; webhook remains source of truth for paid status.

## Business admin login handover
- When a site-admin access code is generated/reset from platform admin setup requests, a transactional email attempt is made to the business admin email.
- Email includes login URL, site slug, admin email, and one-time access code with privacy guidance.
- If email fails or is not configured, platform admin sees delivery status and can manually share the one-time code as temporary fallback.
- `/site-admin/login` now explicitly instructs business owners to check junk/spam if they do not see access emails.

## 2026-06-01 deliverability and anti-spam hardening
- Transactional access-code handover continues to send fail-soft and now uses platform reply-to where configured.
- Deliverability expectations:
  - sender domain alignment (SPF/DKIM/DMARC) is required for `myexperiment.club`
  - inbox placement can still vary while domain reputation builds (Outlook/Hotmail/Gmail checks required)
  - customer-facing confirmation/login guidance continues to remind users to check junk/spam
- Public setup/order submission now includes low-friction anti-spam controls:
  - honeypot field
  - minimum form-completion-time check
  - stricter basic validation for key fields
  - generic safe acceptance response for filtered spam-style submissions
- Sales lead estimated current cost now comes from a platform-admin-managed provider pricing source instead of fixed UI-only values.

## Confirmation page copy
- `/setup/confirmation` `Next Steps` now states:
  - order/domain check
  - clean site + admin prep
  - business admin login email delivery
  - inbox + junk/spam reminder
  - go-live/domain support sequence

## 2026-06-01 sales campaign email presentation polish
- Sales campaign sends from `/admin/sales` now deliver branded HTML emails (plus plain-text fallback) instead of raw plain-text rendering.
- HTML email includes MyExperiment.club hero image, CTA hierarchy, and footer unsubscribe compliance.
- Controlled selected-send constraints remain: selected leads only, suppression re-check server-side, signed unsubscribe links, and sent tracking only on successful provider sends.
- Live unrestricted bulk sending remains disabled.

## 2026-06-01 industry sales-page conversion polish
- Industry landing pages (starting with `/barbers`, via reusable `/[industry]`) now use stronger conversion copy focused on business value, control, and setup confidence.
- The stakeholder/value section is now a single consolidated section: `Built to help you run the whole business` with clear customer, staff, and owner outcomes.
- Overlapping operations-blueprint content was removed from the industry page to avoid repetition and keep a tighter sales narrative.
- Campaign journeys should continue sending prospects to industry sales pages first (for value/context), then to demo/order CTA paths.

## 2026-06-01 hosted polish: confirmation + demo intro
- `/setup/confirmation` no longer shows an `Update order details` CTA after order submission.
- `Next Steps` copy now states: "We ensure your domain is linked to your new site and aim to go live within a day once the domain is ready."
- `/demo/[industry]` intro heading no longer includes "customer site".
- Demo intro copy now nudges prospects to inspect the admin view for full feature/control context.

## 2026-06-01 demo appearance normalization hardening
- `/demo/[industry]` now normalizes legacy theme/palette values to clean `LIGHT` by default.
- Legacy values (for example old premium/theme-era IDs) no longer force dark/premium rendering.
- Only explicit current appearance values (`light`/`dark`) or the current supported dark pair are treated as a valid dark selection.
- This prevents stale localStorage values from keeping `/demo/barbers` in old dark/premium styling.
## 2026-06-02 Subscriber Services Management

- `/site-admin/[siteSlug]` now provides the first real operational subscriber admin section for `Services/prices`.
- Business owners can add, edit, publish/hide, and archive services for their tenant site.
- `/sites/[siteSlug]` displays only active tenant services with price and duration; inactive services and demo services are not shown.
- The onboarding checklist marks `Add at least one service` complete when the tenant has at least one active service.
- `Book now` currently routes visitors to the Services section and service cards show a `coming soon` booking action until the booking engine milestone.

## 2026-06-02 Subscriber Services Onboarding UX Polish

- `/site-admin/[siteSlug]` now opens the public preview in a separate tab so business owners can keep admin open while checking progress.
- The top `Get your site ready` area is the main progress checklist; the lower `Setup section guide` is a setup map with separate status badges.
- Progress/status labels now use `Done` for complete items and `Needs setup` for incomplete items; the lower setup guide uses `Open` navigation labels instead of duplicate progress states.
- The `Services/prices` editor now uses compact fields for base price, duration, and buffer minutes.
- Per-service recurring and block-booking options are clickable and saved as future booking configuration, even though the full booking engine is not active yet.
- Recurring service interval is single-select (`Weekly`, `Monthly`, or `Annually`) even though the underlying JSON storage can preserve older multi-value data.
- Services can be grouped into tenant-scoped service categories for cleaner public display.
- Saving services refreshes the server-rendered onboarding checklist so active-service progress updates without requiring a manual browser refresh.

## 2026-06-02 Subscriber Staff Management

- `/site-admin/[siteSlug]` now provides a tenant-scoped `Staff setup` section.
- Business owners can add, edit, publish/hide, and archive staff members.
- Subscriber admin uses business-friendly `Role / Position` wording and hides internal/platform role terminology.
- `/sites/[siteSlug]` keeps staff choice secondary for the future booking flow rather than showing staff as a large homepage tile.
- The onboarding checklist uses active tenant staff for the `Add staff or mark staff selection as not required` step.
- Staff login/auth and full rota/availability remain future milestones.

## 2026-06-02 Public Subscriber Homepage IA Polish

- `/sites/[siteSlug]` is now service-led:
  - hero/business intro
  - service categories and active services
  - optional about section only when content is set
- Contact/opening details, policy links, customer account placeholder, staff login, and business admin login are secondary footer/header items.
- Staff options, customer account access, and booking policy notices are no longer large homepage tiles.
- Public service cards show customer-facing fields only: service name, description, price, duration, and a disabled `Book this service (coming soon)` placeholder.
- Internal service configuration such as buffer, recurring options, and block-booking settings is not shown publicly in this pass.

## 2026-06-02 Service Editor Collapse and Public Page Visibility

- `/site-admin/[siteSlug]` keeps saved services collapsed by default so the Services/prices editor is easier to scan as a real service list grows.
- A saved service expands only when the business owner clicks `Edit`; a newly added draft service opens expanded immediately until it is saved.
- Collapsed service rows show the useful summary fields: service name, category, price, duration, visibility status, and a short description preview.
- Service categories remain tenant-scoped and continue to drive public grouping on `/sites/[siteSlug]`.
- Public subscriber pages now respect the About visibility setting in the top nav and homepage section rendering.
- Contact remains standard and always visible in this phase; making Contact optional would require a dedicated setting/schema decision in a later pass.
- Policy remains optional: when disabled, the public footer no longer shows the `Terms / Policies` link.

## 2026-06-02 Subscriber Opening Hours

- `/site-admin/[siteSlug]` now provides a real tenant-scoped `Opening hours / rota` setup area for normal business opening hours.
- Business owners can set Monday-Sunday open/closed state plus 24-hour opening and closing times.
- Opening hours are persisted as structured settings data (`CustomerSiteSettings.openingHoursJson`) and summarised into `openingHoursSummary` for display/search/support compatibility.
- Validation requires open days to have both times and requires closing time to be after opening time.
- The onboarding checklist marks `Set opening hours` as `Done` when at least one open day has a valid time window.
- `/sites/[siteSlug]` and the contact page show opening hours subtly in the contact/footer area; the public homepage remains service-led.
- Booking engine availability remains future work. Business opening hours define the business-wide availability window; staff rota/availability and closures/holidays will later refine or override it.

## 2026-06-02 Subscriber Staff Rota

- `/site-admin/[siteSlug]` now supports tenant-scoped staff rota setup using existing `CustomerSiteStaffRotaDay` records.
- Business owners select an active staff member and set Monday-Sunday working state plus 24-hour start/end times.
- Working days require start/end times and the end time must be after the start time; validation is enforced in the UI and API schema.
- Helper actions let owners set Monday-Friday as working or copy Monday's working hours only to weekdays already marked working.
- Rota warnings are shown when staff hours sit outside configured business opening hours, but the save is not hard-blocked because some real businesses may need exceptions before the booking engine is live.
- Break windows remain simple tenant-scoped staff breaks. Active breaks must sit inside that staff member's working rota day.
- The onboarding checklist now treats staff/rota readiness as complete only when at least one active staff member has at least one valid working day.
- Public subscriber pages do not expose detailed rota rows; rota data is used by the tenant-scoped booking availability and confirmed-booking flow.
- Staff login/auth, customer login/auth, payment/prepayment, amendments/rescheduling, recurring bookings, and calendar sync remain future milestones.

## 2026-06-02 Subscriber Closures, Holidays and Staff Leave

- `/site-admin/[siteSlug]` now provides a tenant-scoped `Closures, holidays and staff leave` area inside `Opening hours / rota`.
- Business closures are whole-business date overrides and can capture:
  - reason/name
  - start date and end date
  - all-day or partial-day time range
  - active/inactive state
  - optional customer-facing note
- Staff leave is individual staff unavailability and can capture:
  - staff member
  - reason
  - start date and end date
  - all-day or partial-day time range
  - active/inactive state
  - optional internal notes
- Validation prevents end dates before start dates and requires valid start/end times for partial-day entries.
- Staff leave is checked against active tenant staff so one tenant cannot assign leave to another tenant's staff member.
- Booking availability hierarchy is now documented for future work:
  1. business opening hours define the normal business window
  2. staff rota defines normal staff availability
  3. business closures override the whole business
  4. staff leave overrides individual staff rota
  5. the full booking engine will later combine these with service durations and existing bookings
- Closures and staff leave are optional setup data and do not block `Ready to go live`.
- Public subscriber pages remain service-led. They may show a small current/upcoming business-closure notice near contact/footer details, but they do not expose internal staff leave.

## 2026-06-02 First Subscriber Booking Availability Calculation

- Subscriber sites now have a first tenant-scoped booking availability calculator.
- The calculator uses:
  - active service and its duration/buffer
  - business opening hours
  - active staff members
  - staff rota
  - staff break windows
  - business closures/holidays
  - staff leave/unavailability
  - existing active subscriber bookings where available
- Public `/sites/[siteSlug]` service cards now offer `Check availability` and show compact available time chips grouped by morning, afternoon, and evening for a selected date and optional customer-selectable staff member.
- Selecting a slot highlights the time, scrolls/focuses the booking form, and lets the customer confirm a booking after entering details and accepting the policy.
- Site-admin `/site-admin/[siteSlug]` includes a `Booking availability preview` inside `Opening hours / rota` so business owners can test their setup before live booking submission is built.
- Public availability responses stay customer-friendly and do not expose internal setup/debug reasons.
- Admin availability preview shows setup/debug reasons such as missing service duration, no active staff, no staff rota, business closure, staff leave, breaks, or existing booking conflicts.
- Payment/prepayment, customer login, staff login, recurring bookings, amendment/reschedule handling, and calendar sync remain future milestones.

## 2026-06-02 Platform Domain and Go-Live Workflow

- Platform admin now tracks subscriber-site lifecycle using the existing tenant fields rather than a new model:
  - `TenantSite.status`
  - `TenantSite.provisioningStatus`
  - `TenantSite.domainStatus`
  - `SiteDomain.status`
- New lifecycle vocabulary for the go-live path:
  - `PROVISIONED`
  - `DOMAIN_PENDING`
  - `DOMAIN_READY`
  - `LIVE`
  - `SUSPENDED`
  - `CANCELLED` where applicable
- New paid subscriber sites are created as clean `PROVISIONED` tenant sites. If a requested domain exists, the initial domain state is `DOMAIN_PENDING`.
- `/admin/setup-requests` now shows the linked tenant site's lifecycle, go-live state, primary domain, SiteDomain records, preview route, subscriber-admin route, and a link to manage domain/go-live.
- `/admin/sites` now provides platform actions:
  - mark DNS instructions sent
  - mark domain configured/ready
  - mark site live
  - suspend site
- These actions update platform tracking, SiteDomain status, provisioning tasks, and status events. They do not automate domain purchase, DNS updates, SSL/certificate configuration, or Stripe subscription cancellation.
- `/sites/[siteSlug]` remains the platform preview route for provisioned subscriber sites.
- Final production destination remains the customer's own domain once host/domain routing is enabled.

## 2026-06-02 Staff Rota Validation Hardening

- Site-admin scheduling now normalises non-working rota days before saving: start/end times are ignored and persisted as empty/null when `Working` is off.
- Unticking a working day in `/site-admin/[siteSlug]` clears the visible time fields and deactivates break windows for that staff/day so stale hidden values do not block saving.
- The scheduling API accepts empty optional time fields as unset values, while still requiring start/end times for active working days and active break windows.
- Validation messages now surface the specific day/problem, such as `Monday requires a start and end time.` or `Monday end time must be after start time.`, instead of the generic `VALIDATION_ERROR`.
- Active break windows still must sit inside a working rota day for the same staff member so the availability calculator can trust saved scheduling data.

## 2026-06-02 Rota UX and Availability Preview Polish

- The site-admin staff selector for rota editing now lives inside the `Staff weekly rota` section so business opening hours no longer look tied to a selected staff member.
- The rota UI separates business opening hours, staff weekly rota, break windows, and booking availability preview more clearly.
- `Copy Monday times to working weekdays` copies Monday's times only to Tuesday-Friday rows that are already marked `Working`; it does not turn non-working days on.
- `Set Monday-Friday as working` is the explicit helper for turning weekdays on, using Monday times where available and otherwise business opening hours/default hours.
- Non-working days clear visible start/end times and persist as unset/null values.
- Staff rota can still be saved outside business opening hours, but the warning now states that appointments will only be bookable inside business opening hours.
- The availability calculator already intersects staff rota with business opening hours, so out-of-hours staff rota does not create public bookable slots.
- Public availability hides staff names when the customer chooses `Any available staff`; staff names remain visible in admin preview and when a customer explicitly selects a specific staff member.
- Public availability wording remains customer-safe and does not expose internal debug reasons.
- Public availability uses compact start-time chips rather than large vertical cards. Long groups initially show the first 16 times with a `Show more times` control.
- Site-admin now shows an interim `Staffing coverage` visualisation beside the rota: red for open days with no staff, amber for one staff member, green for two or more, and grey for closed days.
- Target staffing levels by day/time period are not persisted yet; the coverage card documents this as the next staffing-planning milestone.

## 2026-06-02 First Guest Booking Flow

- Subscriber public sites now let a visitor turn an available slot into a stored tenant-scoped confirmed booking.
- The booking flow starts from `/sites/[siteSlug]` service availability:
  1. customer checks availability for a service
  2. customer selects a date, optional staff member, and available slot
  3. customer enters name, email, phone, optional notes, and accepts the booking/cancellation policy
  4. the site stores a `CustomerSiteBooking` with status `CONFIRMED`
- No payment, prepayment, customer login, staff login, or recurring booking creation is implemented in this milestone.
- Server-side booking creation recalculates availability immediately before inserting the booking. The client-selected slot is not trusted by itself.
- When the customer chooses `Any available staff`, the public UI hides staff names, but the selected slot still carries a staff member internally so the booking can block availability correctly.
- `REQUESTED`, legacy `SUBMITTED`, and `CONFIRMED` booking records block future availability. `CANCELLED` bookings do not block slots.
- Public booking confirmation sends fail-soft transactional emails to the customer and the business/site admin when email is configured. The booking still succeeds if email delivery fails.
- Subscriber admins can view bookings in `/site-admin/[siteSlug]` and mark legacy requests confirmed, cancel bookings, or mark bookings completed. Booking amendment is intentionally a future booking-management pass.
- Cancelling a booking from site-admin attempts a fail-soft customer cancellation email. Marking completed does not send email.

## 2026-06-02 Admin Booking Amend and Reschedule

- Subscriber admins can now amend active booking details from `/site-admin/[siteSlug]` without leaving the Bookings section.
- Editable fields include customer name, email, phone, notes, status, service, staff, and date/time through the reschedule picker.
- Rescheduling uses the same tenant-scoped availability calculator as public booking. The booking being edited is excluded as a self-conflict, while other active bookings, business hours, rota, breaks, closures, and staff leave still block slots.
- Saving a reschedule rechecks availability server-side; if the slot has been taken, the admin sees a clear unavailable-slot message.
- Confirmed bookings remain `CONFIRMED` after amendment unless the admin explicitly changes status. Completed/cancelled bookings are not amendable in this first pass.
- Customer update emails are attempted fail-soft with subject `Your booking has been updated`. The booking update still succeeds if email delivery fails.
- Manual time override, customer self-service rescheduling, payment/prepayment, recurring booking amendments, and audit-history events remain future milestones.

## 2026-06-02 Booking Policy and Payment Status Foundation

- `/sites/[siteSlug]/policy` now loads for every valid tenant site and no longer 404s just because the business has not enabled/customised the policy page.
- If the business has not customised policy content, the public policy page shows a professional default booking/cancellation policy and explains that customers should review it before booking.
- `/site-admin/[siteSlug]` warns when the default policy is still being used and lets the business explicitly confirm they have reviewed/accepted the default policy.
- The onboarding checklist only treats booking/cancellation policy as done when policy content is customised or the default has been explicitly accepted.
- Public booking form policy links open `/sites/[siteSlug]/policy` in a new tab and the policy checkbox remains required.
- New public slot bookings are forced to `CONFIRMED` by the server; client defaults cannot downgrade them to `REQUESTED`.
- First payment/prepayment handling is conservative:
  - no card details are collected or stored
  - no subscriber Stripe/Square checkout is created yet
  - if prepayment is required and card payments are enabled, the booking is confirmed with payment status `PENDING` and the customer is told payment will be arranged directly
  - if cash/manual payment is expected, the booking is confirmed with payment status `PENDING`
  - if no payment is required online, the booking is confirmed with payment status `NOT_REQUIRED`
- Site-admin Bookings show friendly payment labels and can mark pending manual/cash payment as received. Refund handling remains future work.

## Subscriber Booking Card Checkout Foundation

- Subscriber booking prepayment now uses Stripe Checkout when a tenant site has card payments enabled and requires prepayment.
- The booking is created tenant-scoped with `status=CONFIRMED`, `paymentStatus=PENDING`, `paymentMethod=CARD_ONLINE`, the fixed service amount, currency, and Stripe session metadata.
- Stripe Checkout receives metadata for `tenantSiteId`, `siteSlug`, `bookingId`, `serviceId`, optional `staffId`, and customer email so webhooks can reconcile safely.
- Card details are handled by Stripe Checkout only; the app does not store card details.
- The Stripe webhook marks booking payments as `PAID` on successful checkout and records Stripe session/payment intent references where available.
- If checkout expires or payment fails, the booking payment state is marked failed while the booking remains visible for admin follow-up in this first pass.
- If online payment is not configured, or a service has no fixed price, the public booking flow shows a clear customer message and does not fake a paid booking.
- Cash/manual payment remains supported and can still be marked paid manually by the business admin.
- Refunds, payout/accounting reports, provider onboarding, and manual online-card payment overrides are future work.

## Booking Cancellation and Refund Handling

- Site admins now cancel bookings through a confirmation panel instead of an instant cancel action.
- The cancellation panel shows booking details, payment method/status, configured policy guidance, and a refund recommendation based on the site's full-refund and no-refund windows.
- Refund guidance is recorded on `CustomerSiteBooking` as operational guidance only, using wording such as `Based on the configured policy...` rather than hard legal claims.
- Cancelled bookings no longer block availability because the availability engine only treats active booking statuses (`REQUESTED`, `SUBMITTED`, `CONFIRMED`) as slot blockers.
- Cash/manual paid bookings can be cancelled and marked as manually handled. Card refunds are not processed automatically in this pass.
- Paid online-card bookings are marked `MANUAL_REQUIRED` for refund handling, with instructions to process any refund manually in the payment provider.
- Customer cancellation emails are attempted fail-soft and include service, date/time, staff, optional cancellation reason, and payment/refund wording.
- Full refund API calls, refund ledgers, accounting reports, customer self-service cancellation, and recurring booking refunds remain future work.

## Customer Booking Lookup Link

- Customer booking emails now include a signed booking details link for the specific tenant/site/booking.
- The route is `/sites/[siteSlug]/booking/[token]`; the token is HMAC-signed and scoped to tenant site, site slug, and booking ID.
- Customers can view booking status, service, staff, date/time, payment status, refund status/guidance, business contact details, and policy links without a full customer account.
- The booking page does not expose platform admin links, provider secrets, internal tenant IDs, or other customer bookings.
- Customer self-service cancellation is conservative in this pass: future unpaid/manual/no-online-payment bookings can be cancelled from the secure link; paid or online-card bookings show contact/refund guidance instead.
- Customer self-rescheduling remains future work. The page tells customers to contact the business to change a booking.

## Shared Staff Appointment View

- Provisioned subscriber sites now have a first-pass staff route at `/site-staff/[siteSlug]`.
- The staff view is tenant-scoped and shows a shared business appointment diary, not only the signed-in staff member's own appointments.
- Business owners generate/reset staff access from `/site-admin/[siteSlug]` in the Staff setup section.
- Staff access uses the existing staff member email plus a generated access code. The code is hashed before storage; only an immediate one-time handover code is shown in the business admin UI.
- Staff login uses `/site-staff/login` and stores a signed, HTTP-only staff session cookie scoped to `/site-staff`.
- Any active staff member with enabled access can view today's appointments, upcoming appointments, and recent completed/cancelled appointments for the tenant site.
- Staff can mark active bookings completed. Staff cannot edit settings, pricing, rota, policies, payments, refunds, platform admin state, or subscriber admin controls in this pass.
- `/sites/[siteSlug]` footer staff login now points to the new staff route while remaining low prominence.
- Full staff permissions, staff-specific auth roles, staff email delivery, notes/audit history, cancellation/reschedule actions, and customer/staff account systems remain future milestones.

## Customer Accounts and Staff Permissions v1

- Provisioned subscriber sites now have tenant-scoped customer account routes under `/sites/[siteSlug]/account`.
- Customers can register with first name, last name, email, phone, and a private access code. The access code is hashed before storage.
- Customer login is site-specific and uses a signed HTTP-only session cookie scoped to `/sites`.
- Guest booking remains available. A logged-in customer's booking form is prefilled from their account, and successful bookings are linked to that tenant customer account.
- Customer account dashboards show only bookings linked to that tenant/customer account, grouped into upcoming, past, and cancelled bookings.
- Secure single-booking lookup links remain available from booking emails and continue to work independently of customer accounts.
- Registration and login errors are intentionally generic enough to avoid exposing whether an email already has an account on a tenant site.
- Public customer account links now point to `/sites/[siteSlug]/account` instead of a coming-soon placeholder.
- Staff setup now stores per-staff permissions on `CustomerSiteStaffMember.staffPermissions`.
- Standard staff can view the shared appointment diary but cannot see customer phone/email, payment status, or appointment actions.
- Super-user staff can be granted permissions for marking appointments completed, viewing customer contact details, viewing payment status, and future operational actions such as manual bookings, amendments, cancellations, and voucher redemption.
- The staff diary and mark-completed API both enforce permissions server-side. UI hiding is not the only control.
- Manual staff booking, staff-side amendments/cancellations, voucher redemption workflows, customer account password reset/email verification, and full customer self-service rescheduling remain future milestones.

## Site Domain Go-Live Workflow Update

- Platform admin domain/go-live tracking uses existing `TenantSite`, `SiteDomain`, `SubscriptionRecord`, provisioning task, and status-event records. No per-customer app or database is introduced.
- `/admin/sites` now includes copyable DNS instruction text for the selected subscriber site. The copy distinguishes customer-owned domains from platform-managed domains.
- DNS instruction copy uses DNS/hosting target values saved on the selected `SiteDomain`. Admin must paste real nameserver/CNAME/A/TXT/hosting verification values once known; the app does not invent final Amplify/custom-domain targets.
- Lifecycle actions now include `REACTIVATE_SITE` alongside DNS instructions sent, domain ready, site live, and suspend.
- Marking a site live attempts a fail-soft customer email with subject `Your website is live`, including the public URL and business-admin URL. Email failure does not block the lifecycle update.
- `resolveTenantSiteByHost()` is the prepared host/domain resolver. It normalises hosts, strips protocol/path/port, handles root/www candidates, resolves `SiteDomain` to `TenantSite`, and excludes suspended/cancelled sites.
- Full runtime custom-domain rendering is not switched on in this pass. `/sites/[siteSlug]` remains the preview route until hosting/DNS target and safe host rewrite routing are finalised.
- Suspended/cancelled sites are excluded from live domain resolution. Preview routes also avoid rendering suspended/cancelled tenant sites through the public preview repository.

## Future Subscriber Payment Provider Integrations

- Future subscriber businesses should be able to connect their own payment processor rather than using one fixed MyExperiment.club/provider configuration.
- Likely supported providers to document and evaluate include Stripe, Square, PayPal, SumUp, Zettle, and additional providers on request where technically and commercially suitable.
- Business-admin payment settings should eventually become provider-aware: selected provider and integration method should determine which guidance, non-secret fields, credential steps, test/live controls, webhook setup, and refund/status options are shown.
- Secure credential handling is required before live provider sync: secrets must never be exposed publicly, stored casually in visible settings, logged, or sent through public routes.
- Each provider integration will need separate webhook signature validation, test/live mode distinction, payment-status reconciliation, cancellation/refund behaviour, and operational error reporting.
- Marketing and FAQ copy should say MyExperiment.club can accommodate common payment providers, with more available on request, without implying every provider is already automated.
- Current handling remains conservative: payment setup records business intent and preferences, Stripe booking checkout is only the current controlled foundation, and unsupported provider integrations must not be faked.

## Subscriber gift vouchers v1

Paid subscriber sites now have a tenant-scoped gift voucher foundation. Business owners enable vouchers from `/site-admin/[siteSlug]` under **Gift vouchers**, configure preset values, optional custom amounts, delivery methods, postage, validity and terms, then choose whether the public site should show the Gift vouchers link.

Public customers use `/sites/[siteSlug]/vouchers` when vouchers are enabled and public-visible. This first version does not take card payment or connect to a subscriber payment provider. Voucher requests are created as `PENDING_PAYMENT`; the business/admin must confirm payment before the voucher becomes `ACTIVE`.

Voucher records are stored centrally and scoped to the `TenantSite`. Demo/localStorage voucher data is not copied into paid subscriber sites and is not used for paid voucher records.

Business admins can view voucher code, purchaser, recipient, amount, delivery method, payment status, voucher status, created/issued/expiry/redeemed dates and message. Admin actions include copying the code, marking payment received/activating, resending active digital voucher email where email is configured, marking redeemed, cancelling and expiring.

Staff can look up voucher codes from `/site-staff/[siteSlug]`. Redeeming an active voucher requires the staff permission `redeemVouchers`; server-side checks enforce the permission regardless of UI state.

Emails are fail-soft: the business is notified on voucher request where a business email exists, and purchaser/recipient emails are attempted when a voucher is activated. Email failure does not block voucher record creation or activation.

## Platform domain/go-live workflow expansion

Platform admin domain/go-live now separates manual domain purchase and DNS tracking into clearer operational states. The lifecycle vocabulary includes `PROVISIONED`, `SETUP_IN_PROGRESS`, `DOMAIN_PENDING`, `DOMAIN_READY`, `LIVE`, `SUSPENDED`, and `CANCELLED`. Domain work can also be tracked as `DOMAIN_TO_BUY`, `DOMAIN_SEARCH_STARTED`, `DOMAIN_AVAILABLE`, `DOMAIN_PURCHASED`, `DNS_INSTRUCTIONS_SENT`, `WAITING_FOR_CUSTOMER_DNS`, `DNS_CONFIGURED`, `DOMAIN_READY`, `LIVE`, or `NEEDS_ATTENTION`.

`/admin/sites` includes a compact SiteDomain editor for the intended live domain. Domain input is normalised by stripping protocols, ports, paths and trailing dots, then lower-casing the host. Active duplicate domains across tenants are rejected. Saving a primary SiteDomain updates the tenant's `domainPrimary` and domain status.

Manual domain purchase remains a platform-admin workflow. Admins can mark domain search started, mark a domain purchased manually, record registrar/renewal/internal notes, copy DNS instruction text, mark waiting for customer DNS, mark DNS configured, mark domain ready, mark site live, suspend, and reactivate.

Custom-domain runtime rendering is still not switched on in middleware/routing. The prepared resolver remains `resolveTenantSiteByHost()`: incoming host -> normalised host/root-www candidates -> `SiteDomain` -> `TenantSite`. `/sites/[siteSlug]` remains the platform preview/admin testing route until final hosting/custom-domain routing is enabled.

When a site is marked live, the platform attempts a fail-soft go-live email. Email failure does not block the status update. Suspended/cancelled sites are excluded from live domain resolution.

Future payment-provider note: subscriber business payment settings must eventually adapt by provider and integration method. Common provider families include Stripe, Square, PayPal, SumUp/Zettle and others on request. Future work must include secure credential handling, no public secret exposure, provider webhook validation, test/live mode distinction, and provider-specific refund/payment-status behaviour.

## 2026-06-02 customer account and booking payment guardrails
- Public subscriber sites link customer access to `/sites/[siteSlug]/account`, with login and registration at `/sites/[siteSlug]/account/login` and `/sites/[siteSlug]/account/register`.
- Customer account v1 is tenant-scoped and access-code based. Logged-in customers can see upcoming, past and cancelled bookings, booking status, service/staff details, payment status, policy links and business contact actions.
- Guest booking remains allowed. If a customer is logged in while booking, the public booking form prefills their saved name/email/phone and associates the booking with that tenant-scoped customer account.
- Subscriber booking payment behaviour now follows the business payment settings conservatively. Platform Stripe checkout for MyExperiment.club subscriptions is not reused for subscriber businesses taking payments from their own customers.
- If online prepayment is required but subscriber checkout is not connected, public booking is blocked with a contact-the-business message. No fake payment success is recorded and no card details are collected.
- If online payment is not required, or cash/manual payment is allowed, bookings can be confirmed with payment marked as not required or pending manual/cash handling for the business admin to reconcile.

## 2026-06-03 customer CRM account foundation
- Public booking confirmation now encourages guest customers to create an account using the same email address, or log in, while still allowing them to continue without an account.
- Logged-in booking flows confirm that the booking has been added to the customer account.
- Customer account dashboards now show tenant bookings linked to the account plus guest bookings for the same tenant with the same verified/login email address. Matching remains tenant-scoped and does not cross businesses.
- Customer registration captures optional marketing consent with an unchecked opt-in. Customers can update their preference from their account dashboard.
- Customer account includes a Special offers placeholder. No customer marketing automation or bulk sends are enabled yet.
- Subscriber site contact now uses a structured tenant-scoped form for booking changes, cancellations, payment questions, general enquiries, complaints/problems and other messages.
- Business admins can view a first-pass Customer CRM in `/site-admin/[siteSlug]`, including account customers, guest booking customers, booking counts/history, marketing consent and customer contact enquiries.

## 2026-06-03 custom-domain tenant routing

Custom-domain runtime rendering is now wired through a safe shared-app route. Requests on recognised customer domains are rewritten by `src/middleware.ts` to the internal `/tenant-domain-runtime/[[...tenantPath]]` route. That route resolves the incoming host with `SiteDomain -> TenantSite` and renders the same tenant-scoped public site used by `/sites/[siteSlug]`.

Key behaviour:
- `/sites/[siteSlug]` remains the platform preview route.
- Customer domains render the tenant site only when the mapped `SiteDomain` and `TenantSite` are live/active enough for public traffic.
- Platform hosts such as `myexperiment.club`, `www.myexperiment.club`, localhost and Amplify app hosts keep normal platform routing.
- Platform/admin/demo/setup routes are not taken over on platform hosts.
- Customer-domain public links prefer customer-domain-relative routes such as `/contact`, `/policy`, `/account`, `/booking/...` instead of bouncing visitors to `/sites/[siteSlug]`.
- APIs remain tenant-scoped through `/api/sites/[siteSlug]/...` and continue to validate site slug/tenant data server-side.
- Suspended or cancelled matched sites show a polite unavailable page rather than the normal booking site.
- Unknown custom hosts do not leak tenant data.

DNS purchase, registrar updates, DNS provider changes and certificate/custom-domain attachment remain manual operational work. The app now prepares the runtime mapping once the customer domain reaches the shared app and the host header is preserved.

## 2026-06-03 DNS instruction handover polish

Platform admin `/admin/sites` now stores DNS/hosting target values on the relevant `SiteDomain.dnsInstructions` JSON rather than relying on a global placeholder. Admins can paste exact nameserver, CNAME, A, TXT or hosting verification values when they are known. The system deliberately warns when these values are missing and must not invent DNS targets.

The DNS instruction copy now uses customer/business wording rather than "new MyExperiment.club website". It includes business name, final domain, platform preview route, subscriber admin route, saved DNS/hosting target values and support wording.

Admins can email DNS instructions to the setup request contact email from the Domain panel. The email is fail-soft: failed/skipped email delivery is shown in admin and saved on the SiteDomain metadata, while status only advances to `DNS_INSTRUCTIONS_SENT` when the email provider reports success. For customer-owned/customer-managed domains the next operational state is `WAITING_FOR_CUSTOMER_DNS`; platform-managed domains continue through manual DNS configuration.

Domain type guidance is visible in admin: Primary is the normal main customer-facing domain, `www` alias points the `www` version to the same site, Apex/root is the bare domain, and Other alias is for additional mapped domains.

## 2026-06-03 demo/live customer-site alignment

`/sites/[siteSlug]` is the source of truth for the live customer-site shell. `/demo/[industry]` now mirrors that direction more closely instead of using the older demo-only card/navigation layout.

Current alignment:
- Demo homepage preview uses the same customer-site pattern: public nav, hero, service-led section, grouped service cards, availability-style selector, customer login link, footer-level policy/contact/staff/admin links.
- Demo booking actions remain safe. Availability slots are illustrative and do not create real tenant bookings or paid subscriber records.
- Demo data remains industry-specific and separate from paid tenant data.
- Paid subscriber sites still start clean and are rendered through `/sites/[siteSlug]` or custom-domain routing.

Window Cleaning is a supported industry offering using slug `window-cleaning`. It appears in Home Services, has a sales route at `/window-cleaning`, a demo route at `/demo/window-cleaning`, and is available anywhere the shared `WEBSITE_TEMPLATE_SLUGS` industry list is used, including sales pipeline dropdowns.
