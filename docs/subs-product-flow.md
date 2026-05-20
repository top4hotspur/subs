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
- First deep appointment workflow is for:
  - `barbers`
  - `hairdressers`
  - `nail-salon`
- Preferred time uses morning/afternoon/evening tile selection.
- Tiles are preference hints, not guaranteed live availability.
- When staff is selected, local rota and break windows can shape preferred slot suggestions.

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
