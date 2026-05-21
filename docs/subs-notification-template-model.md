# Subs Notification Template Model

## Purpose
Define reusable, local-only notification templates for customer sites.
This is preview/edit modeling only and does not send real messages.

## Channels
- Email (`EMAIL`) - included as standard
- WhatsApp (`WHATSAPP`) - optional add-on only (+£10/month)

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

Defaults include both email and WhatsApp versions.
WhatsApp defaults are created but disabled unless add-on is enabled.

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

This is preview-only. No real email/WhatsApp sending.

## Future boundaries
Not implemented in this phase:
- SMTP/email provider integration
- Twilio/WhatsApp integration
- delivery logs/retries
- API/webhook orchestration
- per-customer messaging preferences persistence in DB

Future Twilio path:
- local templates are designed to map to Twilio Content Templates later
- backend credentials/workflows are required before any sync can happen
- WhatsApp templates typically require provider approval before live sends
- current UI only shows local metadata/status and does not sync/send

