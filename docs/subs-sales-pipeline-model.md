# Subs sales pipeline model

## Scope in this phase
- Lead import and enrichment
- Duplicate-aware import approval
- Campaign preparation and manual sent-state tracking
- Preview-only campaign copy
- Resend webhook ingestion foundation stub

## Lead CSV template columns
- businessName
- country
- cityTown
- postcode
- address
- industrySlug
- serviceArea
- contactName
- email
- phone
- leadSource
- sourceUrl
- currentProvider
- estimatedCurrentMonthlyCost
- notes

## URL import and enrichment preview
- `/admin/sales` includes a `Lead Import & Enrichment` section for pasted or uploaded source URLs, one URL per line.
- The workflow creates `SalesLeadImportBatch` and `SalesLeadImportRow` preview records before anything is approved into `SalesLead`.
- URL import is review-first: rows can be edited, skipped, marked for email research, or approved into the pipeline.
- Booksy URLs seed leadSource `Booksy`, currentProvider `Booksy`, and estimatedCurrentMonthlyCost `40`.
- The first pass does not bypass robots.txt, login walls, captchas, rate limits or anti-bot protections.
- Hidden/private emails are not scraped. Missing email addresses remain marked for public website/manual research.

## Duplicate detection rules
- Primary: same postcode + same industrySlug
- Additional checks:
  - same businessName + postcode
  - same email
  - same phone

CSV and URL import rows are explicitly marked and require admin decision for duplicates. Duplicate URL rows can be approved anyway only through an explicit admin choice.

## Campaign levels
- LAUNCH_OFFER
- INTRODUCTION
- REMINDER

Definitions are implemented as preview copy in `/admin/sales`.

## Compliance foundation
- SalesLead.marketingStatus:
  - ACTIVE
  - DO_NOT_CONTACT
  - UNSUBSCRIBED
  - BOUNCED
- SalesLead.unsubscribedAt
- SalesLead.doNotContactReason

Live campaign sends must suppress non-ACTIVE leads.

URL import does not send campaign emails. Before any later outreach, admins must confirm the lead is a suitable business contact and honour unsubscribe/do-not-contact requests.

## Tracking foundation
- SalesCampaign
- SalesCampaignRecipient
- SalesCampaignEvent
- `/api/resend/webhook` currently returns 501 until signed webhook verification is implemented.
