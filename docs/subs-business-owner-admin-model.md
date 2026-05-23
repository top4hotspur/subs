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

