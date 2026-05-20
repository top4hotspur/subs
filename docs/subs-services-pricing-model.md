# Subs Services & Pricing Model

## Purpose
Shared services/products/pricing model for all industry templates.
Current implementation is local/mock and browser-only.

## Core model
`SiteServiceItem` fields:
- `id`, `name`, `description`
- `priceLabel`, `durationMinutes`, `category`
- `bookable`, `requiresQuote`, `active`

File:
- `src/lib/sites/site-settings-types.ts`

## Local settings key
- `subs-site-settings:<industrySlug>`

Helper:
- `src/lib/sites/local-site-settings.ts`

## Admin editing
`/admin/settings` allows:
- service CRUD and activation
- staff linking to services
- availability editing for scheduling context

## Availability/scheduling link
Service durations and staff/business availability now provide structure for future slot logic.

Availability keys:
- `subs-business-availability:<industrySlug>`
- `subs-staff-availability:<industrySlug>`

## Request form integration
Customer request form uses active locally-edited services first, then falls back to template defaults.

## Not built yet
- real payments/Stripe
- pricing rules engine
- deposits/cancellation rules
- DB/API persistence

