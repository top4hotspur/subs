# Subs Industry Operations Blueprint

## Purpose
Each industry needs a tailored operational model, even though all websites share the same core subscription offer.
This blueprint keeps the product simple at the commercial layer while allowing industry-specific workflows later.

## Centralized display component
Blueprint UI rendering is centralized in:
- `src/components/industry/operations-blueprint-summary.tsx`

Usage:
- Industry pages (`/[industry]`) use `variant="full"` and can show lifecycle stages.
- Setup pages (`/setup/[industry]`) use `variant="compact"` with portal/admin highlights and no lifecycle list.

This display is informational/static only in the current phase.
Request capture uses the shared model documented in `docs/subs-customer-request-model.md`, with per-industry defaults.

## Shared two-layer portal concept

### Customer layer
- login (future)
- view bookings/requests
- manage/cancel where allowed
- view confirmations/messages
- update basic profile details

### Business owner/admin layer
- manage services and prices
- manage bookings/enquiries/jobs
- allocate staff
- manage calendar/scheduling windows
- mark jobs complete
- review analytics and financial records
- manage customer communication preferences
- email notifications included
- WhatsApp notifications only with add-on

## Industry blueprint summary (launch 12)
| Industry | Action label | Operation mode | Scheduling mode | Staff allocation | Pricing mode |
| --- | --- | --- | --- | --- | --- |
| taxi | Request fare or book ride | QUOTE_REQUEST | ROUTE_BASED | BUSINESS_ALLOCATES | DISTANCE_TIME_BASED |
| barbers | Book appointment | BOOKING | FIXED_TIME_SLOT | CUSTOMER_SELECTS | FIXED_SERVICE_PRICE |
| hairdressers | Book consultation or appointment | BOOKING | FIXED_TIME_SLOT | CUSTOMER_SELECTS | FROM_PRICE |
| beauticians | Book treatment | BOOKING | FIXED_TIME_SLOT | BUSINESS_ALLOCATES | FIXED_SERVICE_PRICE |
| nail-salon | Book nail appointment | BOOKING | FIXED_TIME_SLOT | BUSINESS_ALLOCATES | FIXED_SERVICE_PRICE |
| massage | Book massage session | BOOKING | FIXED_TIME_SLOT | BUSINESS_ALLOCATES | FIXED_SERVICE_PRICE |
| window-cleaning | Request quote | QUOTE_REQUEST | FLEXIBLE_JOB_WINDOW | BUSINESS_ALLOCATES | QUOTE_BASED |
| dog-grooming | Book grooming appointment | BOOKING | FIXED_TIME_SLOT | BUSINESS_ALLOCATES | FROM_PRICE |
| driving-instructors | Book lesson | BOOKING | LESSON_SLOT | BUSINESS_ALLOCATES | PACKAGE_BASED |
| mobile-valeting | Request valeting booking | JOB_REQUEST | FLEXIBLE_JOB_WINDOW | BUSINESS_ALLOCATES | PACKAGE_BASED |
| cleaners | Request cleaning service | JOB_REQUEST | FLEXIBLE_JOB_WINDOW | BUSINESS_ALLOCATES | HOURLY |
| gardeners | Request gardening job | JOB_REQUEST | FLEXIBLE_JOB_WINDOW | BUSINESS_ALLOCATES | QUOTE_BASED |

## Taxi/private-hire module deep-dive
Taxi/private-hire detailed requirements are documented in:
- `docs/subs-taxi-module-requirements.md`

Key additions for taxi:
1. Expanded quote/request types (local, airport, corporate, golf, tour, event, return, multi-stop).
2. Detailed request fields (pickup, destination, timing, passengers, luggage, accessibility, flight, notes).
3. Deeper lifecycle:
`DRAFT/REQUESTED`, `REVIEWING`, `QUOTED`, `ACCEPTED`, `PAYMENT_PENDING`, `CONFIRMED`, `DRIVER_ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
4. Admin workflow depth (quote inbox, pricing settings/uplifts, driver allocation, journey calendar, income tracking).
5. Notifications aligned to shared model (email standard, WhatsApp via optional add-on only).

## Job completion messaging concept
When business marks work complete:
1. Close booking/job.
2. Send completion notification.
3. Confirm completion and include friendly follow-up line.
4. If another booking exists, include next booking date.
5. If no future booking exists, include return link and review request.
6. Send by email as standard.
7. Send via WhatsApp only when add-on is enabled.

## What is not built yet
- no real auth
- no DB persistence
- no APIs
- no payment processing
- no live booking/job engine

Current implementation is local/static/mock only.
