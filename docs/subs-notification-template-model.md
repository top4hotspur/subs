# Subs Notification Template Model

## Purpose
Define reusable, local-only notification templates for customer sites.
This is preview/edit modeling only and does not send real messages.

## Channels
- Email (`EMAIL`) - included as standard
- WhatsApp channel metadata remains in internal models only and is not part of the current public offering.

## Events
- `SETUP_REQUEST_RECEIVED`
- `CUSTOMER_REQUEST_RECEIVED`
- `QUOTE_SENT`
- `BOOKING_CONFIRMED`
- `STAFF_ASSIGNED`
- `REMINDER`
- `JOB_COMPLETED`
- `REVIEW_REQUEST`
- `REQUEST_CANCELLED`
- `REQUEST_CHANGED`

## Core types
Implemented in:
- `src/lib/notifications/notification-types.ts`

Additional local metadata placeholders:
- `provider` (`LOCAL` or `TWILIO`)
- `providerTemplateId`
- `providerApprovalStatus` (`NOT_SYNCED`, `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`)
- `lastSyncedAtIso`

## Defaults
Implemented in:
- `src/lib/notifications/default-notification-templates.ts`

Defaults are currently focused on email templates for customer-facing flows.

## Variables
Template tokens include:
- `{{businessName}}`
- `{{customerName}}`
- `{{serviceName}}`
- `{{bookingDate}}`
- `{{bookingTime}}`
- `{{staffName}}`
- `{{websiteUrl}}`
- `{{reviewUrl}}`
- `{{nextBookingDate}}`

## Completion/review wording
`JOB_COMPLETED` default text includes:
- completion confirmation
- "Hope everything went well"
- optional next booking mention (`{{nextBookingDate}}`)
- return link (`{{websiteUrl}}`)

`REVIEW_REQUEST` includes `{{reviewUrl}}`.

Conditional branching (next booking exists vs not) is not fully implemented yet; templates are kept logic-ready for future rule handling.

## Local storage
Key format:
- `subs-notification-templates:<industrySlug>`

Helper file:
- `src/lib/notifications/local-notification-templates.ts`

Functions:
- list/save/update/reset templates
- render preview by replacing `{{variable}}` tokens

## Admin UI
`/admin/settings` contains Notification Templates section:
- grouped by event
- channel badge
- enable/disable
- subject/body editing
- tone selection
- variable list
- live preview
- reset templates

## Admin completion preview
`/admin` completed requests now show which templates would apply:
- `JOB_COMPLETED`
- `REVIEW_REQUEST`

This is preview-only. No real email sending.

## Future boundaries
Not implemented in this phase:
- SMTP/email provider integration
- Twilio/WhatsApp integration
- delivery logs/retries
- API/webhook orchestration
- per-customer messaging preferences persistence in DB

## Booking auto-response local mock
- Booking/request saves now prepare a local email auto-response event log entry.
- These events are browser-local and do not send real email.
- UI wording should remain explicit: `Auto-response prepared` rather than claiming delivery.

