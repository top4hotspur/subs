# Subs Product Flow

## Current v1 flow
1. Homepage -> industry page -> demo page -> customise draft.
2. Customer starts setup and submits a local mock setup request.
3. Mock customer/admin pages show request lifecycle, services, staff, availability, notifications, and analytics previews.

## Demo and preview clarity
- Demo pages now keep control panels compact and show a clear divider before preview content:
  - "Website preview starts here"
- Active/default draft switching remains available, but visual priority is on the website preview.

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
- Public positioning remains simple-package and avoids WhatsApp/expense-tracking launch claims.
