# Subs Mock Setup Workflow

## Purpose
This workflow is browser-only and intentionally localStorage-based so we can demo setup, customer, and admin flows without backend infrastructure.

## Local storage key
- `subs-setup-requests`

## Setup request lifecycle (mock)
1. Customer submits `/setup/[industry]` form.
2. Required fields are validated locally.
3. Request is saved to localStorage with id, totals, timestamp, and status.
4. Customer is redirected to `/setup/confirmation?requestId=<id>`.
5. Same request is visible in mock `/account` and `/admin`.

## Status utility and badge
Shared status display is centralized in:
- `src/lib/setup/status.ts`
  - `setupStatusLabel(status)`
  - `setupStatusDescription(status)`
  - `setupStatusTone(status)`
- `src/components/setup/setup-status-badge.tsx`

This keeps status rendering consistent across confirmation, account, and admin views.

## Mock admin filtering
`/admin` supports local filter modes:
- All
- Review requested
- Domain details required
- Payment pending
- Provisioning
- Live

Filtering is purely client-side against localStorage data.

## Sample request seeding
`seedLocalSetupRequests()` in `src/lib/setup/local-setup-requests.ts` adds 2-3 realistic sample requests only when no requests exist.

`/admin` includes a "Load sample requests" button for demo readiness.

## Empty states
- `/account`: shows no-request message and link to homepage catalogue.
- `/admin`: shows no-request message and "Load sample requests" action.

## Not production persistence
This is not production data storage:
- data is browser-local only
- clearing storage removes data
- no shared user identity
- no server validation or audit trail
