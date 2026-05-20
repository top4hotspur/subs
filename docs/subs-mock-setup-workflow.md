# Subs Mock Setup Workflow

## Purpose
This workflow is browser-only and intentionally localStorage-based so we can demo setup, customer, and admin flows without backend infrastructure.

## Local storage keys
Demo drafts:
- `subs-demo-drafts:index`
- `subs-demo-draft:<draftId>`
- `subs-active-demo-draft:<industrySlug>`

Setup requests:
- `subs-setup-requests`

## Template vs draft behaviour
- Templates are shared and immutable.
- Each prospect/customer customises an isolated named demo draft.
- Multiple drafts per industry are supported in one browser.
- One active draft is tracked per industry for preview/setup continuity.
- Draft updates never mutate template defaults.

## Draft picker and switching
- Customiser includes a local "My demo drafts" picker.
- Users can create, rename, and switch active drafts.
- Switching updates `subs-active-demo-draft:<industrySlug>` and all future edits apply to that draft id.
- `/demo/[industry]` can show active draft preview or default template preview via local toggle.

## Setup request lifecycle (mock)
1. Customer customises active local draft.
2. Setup form reads active draft values for prefill.
3. Request is validated client-side.
4. Request is saved to localStorage with id/totals/status/timestamp.
5. Customer is redirected to confirmation.
6. Same request is visible in mock `/account` and `/admin`.

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

Filtering is client-side only against localStorage data.

## Sample request seeding
`seedLocalSetupRequests()` in `src/lib/setup/local-setup-requests.ts` adds sample requests only when none exist.

`/admin` includes a "Load sample requests" button for easier demos.

## Not production persistence
This is not production data storage:
- data is browser-local only
- clearing storage removes data
- no shared user identity
- no server validation or audit trail
- no API persistence
