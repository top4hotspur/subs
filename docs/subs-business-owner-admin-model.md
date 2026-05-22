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
