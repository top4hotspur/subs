# Subs Data Model

## WebsiteTemplate
A `WebsiteTemplate` is a static template definition for one supported industry.

### Supported launch industries (12)
- `taxi`
- `barbers`
- `hairdressers`
- `beauticians`
- `nail-salon`
- `massage`
- `window-cleaning`
- `dog-grooming`
- `driving-instructors`
- `mobile-valeting`
- `cleaners`
- `gardeners`

## WebsiteSubscriptionOffer
A `WebsiteSubscriptionOffer` defines one commercial offer (no package tiers):
- setup fee
- monthly fee
- optional domain registration/management fee
- optional WhatsApp add-on monthly fee
- included feature list

Source: `src/lib/pricing/subscription-offer.ts`.

## SetupRequestDraft
Client-side setup form draft shape:
- template slug
- domain option
- communication option
- business/contact details
- optional domain and notes fields

## LocalSetupRequest
Browser-persisted mock request record extends setup draft with:
- `id`
- `createdAtIso`
- `status`
- `setupTotalGbp`
- `monthlyTotalGbp`

## Setup request statuses
- `DRAFT_DEMO`
- `SETUP_REVIEW_REQUESTED`
- `DOMAIN_DETAILS_REQUIRED`
- `PAYMENT_PENDING`
- `SITE_PROVISIONING`
- `SITE_LIVE`
- `CHANGE_REQUESTED`
- `CANCELLED`

## Local demo and setup persistence
Customisation drafts:
- key pattern: `subs-demo-draft:<industry-slug>`

Setup requests:
- key: `subs-setup-requests`

Setup page uses demo draft localStorage to prefill business name when available.

## Repository contract
`src/lib/sites/repository.ts` remains template/demo focused:
- `listWebsiteTemplates()`
- `getWebsiteTemplate(slug)`
- `getDefaultDemoConfig(slug)`
- `createDemoDraft(slug)`
- `updateDemoDraft(draft, patch)`

## What moves later to backend
- setup requests to database
- authenticated customer/admin identities
- API create/read/update operations
- billing/payment state and webhooks
- workflow audit and operational history

Current persistence is browser-only mock storage and not production-grade.
