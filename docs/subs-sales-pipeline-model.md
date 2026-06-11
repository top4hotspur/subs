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
- The workflow creates `SalesLeadImportBatch` and `SalesLeadImportRow` preview records before anything is saved into `SalesLead`.
- URL import is review-first: rows can be edited, skipped, marked for email research, or saved into the imported lead dataset.
- Source/profile URLs are stored in data but rendered as compact links, not full table text.
- Booksy URLs seed leadSource `Booksy`, currentProvider `Booksy`, and estimatedCurrentMonthlyCost `40`.
- Booksy search URLs now attempt a single public HTML fetch of the clean path, parse visible JSON-LD listing data when exposed, and create one preview row per visible listing.
- Extracted Booksy fields can include business name, profile URL, visible address/postcode/city, rating/review count and category metadata in row notes/raw metadata.
- Sponsored Booksy listings are skipped when a visible marker can be detected; unknown sponsorship is noted rather than guessed.
- The first pass does not bypass robots.txt, login walls, captchas, rate limits or anti-bot protections.
- Hidden/private emails are not scraped. Missing email addresses remain marked for public website/manual research.
- If Booksy HTML does not expose listing data, the import falls back to a manual-review placeholder row.

## Manual email research workflow
- Campaign Builder rows include a `Find email` Google search link built from business name plus city/town when available, falling back to postcode or business name only.
- The Google link is a human research shortcut only; the app does not scrape Google results or automate email discovery.
- Admins manually verify and paste public business contact emails into the inline email field, then save directly from the candidate table.
- Saved emails are trimmed, lower-cased and checked with a basic email format validation before updating `SalesLead.email`.
- Email status is UI-derived in this phase: no email means `Email missing`; an email present means `Email added manually`; suppressed leads show `Do not contact`.
- Missing-email leads remain ineligible for email campaign sending until an email is saved and marketing status allows contact.

## Imported lead dataset and campaign visibility
- Saved import rows create `SalesLead` records in the imported lead dataset with `pipelineVisibility = RESEARCH` by default.
- `SalesLead.pipelineVisibility` values are `RESEARCH`, `READY_FOR_CAMPAIGN`, `HIDDEN`, and `DO_NOT_CONTACT`.
- Existing leads default to `READY_FOR_CAMPAIGN` for compatibility with the pre-existing Campaign Builder.
- Campaign Builder only shows leads marked `READY_FOR_CAMPAIGN`; imported leads must be explicitly promoted with `Show in campaigns`.
- The dataset table flags missing email, contact name, phone, postcode, business name, do-not-contact state and possible duplicate context.
- Template editor, Campaign Builder, provider pricing, and suppression sections are collapsible to keep the sales page usable.

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
