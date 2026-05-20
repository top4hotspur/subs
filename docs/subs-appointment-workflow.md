# Subs Appointment Workflow (Local Mock)

## Scope
This appointment flow is currently local/mock only and runs in browser storage.
No real auth, database, APIs, payment, or conflict-checking engine is active.

## Current UX
- Appointment-style industries currently include:
  - `barbers`
  - `hairdressers`
  - `nail-salon`
- Form requires:
  - service
  - preferred date
  - preferred time
- Preferred time uses tile groups:
  - Morning
  - Afternoon
  - Evening
- Tiles are generated from local availability windows where present, or fallback preferred examples when not.
- If a preferred staff member is selected and local rota exists, tiles can be generated from that staff member's rota day and break windows.
- The UI explicitly states that the business confirms final availability.

## Staff choice behavior
- Customer-side staff selection only shows staff where:
  - `active === true`
  - `customerSelectable === true`
- If no selectable staff exists, the form shows:
  - "The business will allocate the right team member."

## Future required behavior (not implemented yet)
- Logged-in customer profile should prefill name/email/phone.
- Actual available appointment times must be generated from:
  - business opening hours
  - staff rota / working days
  - staff breaks
  - service duration
  - booking buffers
  - existing confirmed bookings
  - admin rule for customer staff selection
- A selected staff member must:
  - be working that day/time
  - not already have a conflicting booking
- Break windows must block availability.

## Completion/review messaging
Completion and review messaging are still local/mock status outcomes only.
No real message sending is performed in this phase.

## Local storage keys used
- `subs-customer-requests`
- `subs-staff-availability:<industrySlug>`
- `subs-business-availability:<industrySlug>`
- `subs-staff-rota:<industrySlug>`
