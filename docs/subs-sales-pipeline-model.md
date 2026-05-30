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

## Duplicate detection rules
- Primary: same postcode + same industrySlug
- Additional checks:
  - same businessName + postcode
  - same email
  - same phone

Import rows are explicitly marked and require admin decision for duplicates.

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

## Tracking foundation
- SalesCampaign
- SalesCampaignRecipient
- SalesCampaignEvent
- `/api/resend/webhook` currently returns 501 until signed webhook verification is implemented.
