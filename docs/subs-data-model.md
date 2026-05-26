# Subs Data Model

## Architecture Rule (v1)
- MyExperiment.club runs as one shared app with one central Postgres/Neon database.
- Subscriber isolation is implemented by `tenantSiteId` on site-scoped records.
- Customer domains map to `TenantSite` and route to tenant-scoped data.
- v1 does not default to per-customer code exports or per-customer databases.

## Core Domains
- Industry catalogue: 14 launch industries (including tutors and bus-hire)
- Templates/themes: subscriber visual system for customer-facing sites
- Setup/provisioning: setup requests, tenant sites, domain records, subscription placeholders, provisioning tasks
- Site settings: per-tenant persisted settings
- Services/pricing: per-tenant persisted service catalogue
- Staff: per-tenant persisted roles and staff members
- Scheduling: per-tenant persisted rota days, break windows, closures, holidays
- Demo business-admin tools: local/mock modules still transitioning to persistence

## Persisted Tenant-Scoped Models (Current)
- `TenantSite`
- `SiteDomain`
- `SubscriptionRecord`
- `ProvisioningTask`
- `CustomerSiteSettings`
- `CustomerSiteService`
- `CustomerSiteStaffRole`
- `CustomerSiteStaffMember`
- `CustomerSiteStaffRotaDay`
- `CustomerSiteStaffBreakWindow`
- `CustomerSiteBusinessClosure`
- `CustomerSiteStaffHoliday`
- `CustomerSiteAdminUser`

All site-scoped models above are keyed/scoped by `tenantSiteId`.

## Not Persisted Yet (Current)
- vouchers
- page content blocks/modules
- policy content blocks/modules
- social media persistence
- booking/customer account persistence
- media/logo file storage
- payment provider integration data

## CustomerSiteAdminUser (new)
- Purpose: tenant-scoped subscriber business-owner/admin access.
- Core fields:
  - `tenantSiteId`
  - `email`
  - `displayName`
  - `role` (`OWNER` | `ADMIN`)
  - `active`
  - `invitationStatus` (`INVITED` | `ACTIVE` | `DISABLED`)
  - `accessCodeHash` (hashed only, no plaintext codes stored)
- Security:
  - unique per tenant on (`tenantSiteId`, `email`)
  - used for site-admin auth scope, not platform-admin auth

## Domain Resolution Data Path (v1)
1. read incoming host
2. lookup `SiteDomain.domain`
3. resolve `TenantSite`
4. query tenant-scoped settings/services/content via `tenantSiteId`
5. render tenant customer-facing site

If no domain match exists, platform routes continue normally.

## Provisioning Data Behavior
When creating a subscriber site from setup request, system should create baseline tenant entities and a clean editable subscriber-site structure. Demo data is not copied by default; any draft import should be an explicit future option.

## Persisted preview query model
- New tenant-scoped preview aggregation reads:
  - tenant metadata (`TenantSite`)
  - persisted site settings (`CustomerSiteSettings`)
  - persisted services (`CustomerSiteService`)
  - persisted staff roles/staff members (`CustomerSiteStaffRole`, `CustomerSiteStaffMember`)
  - persisted scheduling (`CustomerSiteStaffRotaDay`, `CustomerSiteStaffBreakWindow`, `CustomerSiteBusinessClosure`, `CustomerSiteStaffHoliday`)
- Used by `/admin/sites/[siteId]/preview` as internal customer-facing render proof.

## Persisted tenant booking model
Added model:
- `CustomerSiteBooking`

Core fields include:
- tenantSiteId
- serviceId/serviceName
- customer details (name/email/phone)
- preferredDate/preferredTime
- staffMemberId/staffName
- status/paymentStatus
- notes/source/rawPayload

Indexes:
- tenantSiteId
- tenantSiteId + preferredDate
- tenantSiteId + status
- tenantSiteId + staffMemberId
- tenantSiteId + serviceId

Current API surface (platform-admin protected):
- `GET/POST /api/admin/sites/[id]/bookings`
- `PATCH /api/admin/sites/[id]/bookings/[bookingId]`

Conflict behavior (v1):
- prevents duplicate active staff slot bookings for same tenant/date/time
- ignores `CANCELLED` and `NO_SHOW`
- no production-grade locking/transactional slot reservation yet

## Slug-based tenant lookup path (new)
- Public route `/sites/[siteSlug]` resolves `TenantSite.slug` and renders tenant-scoped persisted records.
- Same tenant-scoped record set used as preview route:
  - settings, services, staff/roles, scheduling, recent bookings.

## Public booking API model (new)
- `POST /api/sites/[siteSlug]/bookings` resolves tenant server-side.
- Writes to `CustomerSiteBooking` with tenant scoping.
- Conflict rule remains simple v1 check on active staff/date/time collisions.

## Tenant host resolution utilities
- Added `src/lib/sites/tenant-resolver.ts`:
  - `normalizeHost(host)`
  - `getTenantSiteByDomainHost(host)`
  - `getTenantSiteBySlug(slug)`
  - `resolveTenantFromRequestHost(headers)`
- SiteDomain lookup now has a reusable path for future custom-domain runtime routing.

## Diagnostic endpoint
- Added `GET /api/site-resolve-debug` (platform-admin guarded).
- Supports temporary test header `x-test-site-host` for pre-domain-attachment validation.

## Site-admin scope update
- Business-owner site-admin now has persisted edit access (tenant-scoped) for:
  - site settings
  - services
  - staff roles
  - staff members
  - scheduling snapshot (rota, breaks, closures, holidays)
- Read-only access for bookings summary is provided in `/site-admin/[siteSlug]`.

## Tenant branding media storage (first real slice)
- Added first real persisted media scope for subscriber sites: `logo` and `favicon` only.
- Storage is S3-compatible and tenant-scoped by key pattern:
  - `sites/{tenantSiteId}/branding/logo/{file}`
  - `sites/{tenantSiteId}/branding/favicon/{file}`
- `CustomerSiteSettings` now stores metadata only (no file bytes in Postgres):
  - `logoUrl`, `logoStorageKey`, `logoContentType`, `logoFileName`
  - `faviconUrl`, `faviconStorageKey`, `faviconContentType`, `faviconFileName`
- Site-admin API routes:
  - `POST/DELETE /api/site-admin/[siteSlug]/branding/logo`
  - `POST/DELETE /api/site-admin/[siteSlug]/branding/favicon`
- Validation:
  - Logo: png/svg/jpeg/webp, max 1MB
  - Favicon: png/ico/svg, max 512KB
- Security:
  - tenant-scoped session checks; no cross-tenant writes
  - no public write route
- Public rendering:
  - `/sites/[siteSlug]` uses `logoUrl` when available, otherwise text brand fallback.
  - favicon metadata is now wired when `faviconUrl` is present.
- Out of scope in this slice: gallery images, about/staff images, general media library.

## Persisted payment setup configuration (tenant-scoped)
- `CustomerSiteSettings` now persists payment setup intent fields:
  - `paymentProcessorSetupMode` (`EXISTING_PROCESSOR` | `NEED_HELP_SETUP` | `MANUAL_RECORDING_ONLY`)
  - `paymentProcessorName` (`Stripe`, `Square`, `SumUp`, `PayPal`, `Worldpay`, `Zettle`, `Other`)
  - `paymentProcessorAccountRef` (reference only, no secrets)
  - `paymentProcessorNotes`
  - `acceptCashPayments`
  - `acceptCardPayments`
  - `requireBookingPrepayment`
  - `allowInStorePaymentRecording`
  - `cancellationFullRefundNoticeDays`
  - `cancellationNoRefundWithinDays`
  - `cancellationPolicyNote`
- This remains configuration/preparation only.
- No API keys, card details, checkout, payment capture, refunds, or provider webhooks are stored/implemented.
