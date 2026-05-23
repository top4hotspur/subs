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

## Site design propagation notes
- Visual template and colour scheme changes in `/demo/[industry]/admin` now save immediately in local mock settings.
- Customer-facing `/demo/[industry]` re-reads local settings so selected template/scheme changes are reflected consistently.
- Available colour schemes now include Calm Blue, Fresh Green, Warm Coral, and Midnight Lime (dark premium option).

## Payment processor setup intent (local mock)
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
