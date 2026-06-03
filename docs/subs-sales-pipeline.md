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
- country
- city/town
- address/area location notes
- industry slug/label
- contact name
- email
- phone
- status
- source
- notes
- last contacted date/time
- last marketing email date/time
- email sent count
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
- Country / `country`
- City / Town / `cityTown`
- Location / `location`

Flow:
1. Upload CSV
2. Preview valid/invalid rows
3. Import valid rows
4. Show skipped/error rows

## CSV export
Exports include:
- business name
- country
- city/town
- location
- industry
- contact name
- email
- phone
- status
- source
- notes
- last contacted
- last marketing email
- email sent count
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

Lead actions:
- Prepare email
- Copy email
- Mark email sent (updates contact timestamp/status trail in persisted lead history)

## Physical outreach printing

Per-lead actions:
- Print letter/flyer
- Print envelope

Bulk actions:
- Select all visible
- Clear selection
- Print selected letters/flyers
- Print selected envelopes
- Print batch pack

Batch pack print order:
1. letters/flyers first
2. envelopes second

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

## Campaign workflow foundation (current)
- Provider-cost auto-fill: selecting known providers can auto-fill estimated monthly cost (editable override remains allowed).
- Marketing suppression statuses: `ACTIVE`, `DO_NOT_CONTACT`, `UNSUBSCRIBED`, `BOUNCED`, `CONVERTED`.
- Candidate selection now uses explicit checkboxes per lead.
- Eligibility checks include suppression status, snoozed-until date, channel data requirements (email/postal), and already-contacted step checks.
- Manual send tracking updates selected leads only:
  - `lastContactedAt`
  - `lastCampaignStep`
  - campaign recipient status
  - lead event trail
- Persisted editable templates:
  - `EMAIL_INTRODUCTION`
  - `EMAIL_REMINDER`
  - `SNAIL_MAIL_LETTER`
- Unsubscribe route: `/unsubscribe/sales?token=...` marks lead `UNSUBSCRIBED` and terminally suppresses future campaigns.

## Live send note
- Live bulk sending is still disabled.
- Resend webhook ingestion remains verification-gated before automated bounce/unsubscribe event handling is enabled.

## 2026-06-01 sales pipeline hardening update
- Added persisted provider/competitor pricing table (`SalesProviderPricing`) for platform-admin control of estimated monthly competitor costs.
- `/admin/sales` now supports:
  - downloading a leads CSV template
  - provider pricing table add/edit/enable-disable
  - lead estimated monthly cost auto-fill from provider table (`Booksy` default: `£40`)
- Auto-fill behavior:
  - fills estimate when provider is selected and estimate is blank
  - preserves manual override values
  - CSV import preserves explicit estimate values; blank estimate values can auto-fill from known provider pricing
- Manual lead form cleanup:
  - service area removed from lead add flow
  - industry labels shown as human-friendly display labels while stored values remain slug-based
- Candidate/campaign workflow remains suppression-aware and selected-only for manual sent tracking.
- Live bulk marketing send remains disabled in this phase.

## 2026-06-01 template and contact-name upgrade
- Sales leads now support split contact fields:
  - `contactFirstName`
  - `contactLastName`
  - `contactName` remains for backward compatibility.
- Manual lead add now captures first/last name.
- CSV template/import now supports `contactFirstName` + `contactLastName`:
  - older `contactName` rows are still accepted and split where possible.
- Template tokens now include:
  - `{{contactFirstName}}`
  - `{{contactLastName}}`
  - `{{contactName}}`
  - `{{landingPageLink}}` (industry landing page)
  - `{{demoLink}}` (optional demo route)
- Campaign strategy default:
  - primary CTA -> industry landing page
  - demo link is secondary.
- Snail-mail letter preview now shows a QR code for `{{landingPageLink}}`.
- Updated default templates are feature-led (full website + business tooling), not just low-cost booking language.
- Live bulk sending remains disabled.

## 2026-06-01 controlled selected sending + lead cleanup
- `/admin/sales` now supports controlled `Send selected email` actions:
  - sends only to selected eligible leads
  - server-side suppression/eligibility checks are re-run before send
  - skip reasons include: missing/invalid email, suppressed status, snoozed, already received step
- `Mark selected as sent manually` remains separate and does not dispatch provider email.
- Marketing emails keep unsubscribe token links per lead.
- Send outcomes now report sent/skipped/failed counts.
- Test lead cleanup is now available:
  - per-row delete
  - bulk `Delete selected test leads`
  - leads with campaign history/converted state require stronger force confirmation.
- Unrestricted bulk blast sending remains disabled.

## 2026-06-01 branded sales email HTML rendering
- Controlled sales campaign sends now include a branded HTML wrapper with:
  - header image asset: `/email/myexperiment-email-hero.png`
  - responsive ~600px email container and email-safe inline styling
  - CTA layout (`See how it works` + `View example demo`)
  - footer unsubscribe/compliance line
- Template bodies are rendered into structured HTML:
  - paragraph spacing is preserved
  - `-` / `*` lines render as bullet lists
  - plain URL-only lines are replaced by CTA actions in the visual flow
- Plain-text fallback is still sent for accessibility/deliverability and always includes landing/demo/unsubscribe links.
- Suppression and selected-only controls remain enforced server-side.
- Live unrestricted bulk blast sending remains disabled.
- Inbox placement still depends on SPF/DKIM/DMARC and sender reputation.

## 2026-06-01 campaign landing-page strategy (conversion-first)
- Sales campaign links should direct prospects to the relevant industry sales landing page first (for value explanation and conversion framing), not directly to the demo.
- For barbers, canonical campaign landing route remains: `https://myexperiment.club/barbers`.
- Demo links remain a secondary CTA for prospects who want to explore the working preview.

## Demo and campaign landing-page alignment

Campaign landing links should continue sending prospects to the industry sales page first, for example `/window-cleaning`, before the direct demo link. The sales page explains the offer; the demo then mirrors the live customer-site shell with industry-specific demo data.

The direct demo link remains useful as a secondary CTA because `/demo/[industry]` and `/demo/[industry]/booking` now mirror the live customer-site booking journey with service cards, compact availability chips, policy acceptance and demo-safe confirmation. The demo route must never create real tenant bookings.

Window Cleaning is available as `window-cleaning` in the shared industry list and can be used for lead capture, campaign segmentation, campaign landing pages and demo previews. Demo data is separate from paid subscriber tenant data and includes realistic sample prices plus quote-required examples.
