# Subs Sales Pipeline

## Purpose
Sales Pipeline is for **prospective businesses** that MyExperiment.club wants to convert into subscriptions.

It is separate from customer CRM:
- Sales Pipeline: outreach leads before they become subscribers
- Customer CRM: customer contacts generated from bookings/requests on live site workflows

## Admin route
- `/admin/sales`

This route is admin-only and uses the existing session-protected admin API pattern.

## Persistence model
Persisted in Postgres/Prisma:
- `SalesLead`
- `SalesLeadEvent`

Status values:
- `NEW`
- `CONTACTED`
- `INTERESTED`
- `DEMO_SENT`
- `FOLLOW_UP`
- `WON`
- `LOST`
- `DO_NOT_CONTACT`

## Fields captured
- business name
- location
- industry slug/label
- contact name
- email
- phone
- status
- source
- notes
- last contacted date/time
- next follow-up date

## CSV import
Client-side CSV import (no server file upload).

Expected columns:
- `businessName` (required)
- `location`
- `industry`
- `contactName`
- `email`
- `phone`

Also supports common aliases, for example:
- Business Name / `business_name` / `businessName`
- Telephone / `phone` / `tel`
- Type / Industry / `industry`

Flow:
1. Upload CSV
2. Preview valid/invalid rows
3. Import valid rows
4. Show skipped/error rows

## CSV export
Exports include:
- business name
- location
- industry
- contact name
- email
- phone
- status
- source
- notes
- last contacted
- next follow-up

Also supports event-history export for the selected lead.

## Email template preview (copy only)
Template preview/copy is available for:
- Initial outreach
- Demo follow-up
- Trial/demo link follow-up
- Pricing follow-up
- No-response follow-up

Variables:
- `{{businessName}}`
- `{{contactName}}`
- `{{industry}}`
- `{{demoLink}}`
- `{{pricingSummary}}`
- `{{senderName}}`

## Compliance and sending boundaries
No real sending is implemented.

Before live sending, platform needs:
- provider integration (e.g., SES/Resend)
- unsubscribe handling
- suppression lists
- consent and compliance controls
- audit trails and delivery/error tracking

## Future requirements
- role-based assignment for sales reps
- activity reminders
- campaign sequencing
- conversion analytics (lead -> setup request -> live site)
