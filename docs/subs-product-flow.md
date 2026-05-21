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

