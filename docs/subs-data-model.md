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
- Provisioning behaviour:
  - paid-order clean site provisioning creates the first owner/admin user for the tenant when an admin email is available
  - manual reset/resend reuses the same model and replaces only the hashed access-code value
  - plaintext access codes are never stored and are only shown once to platform admin during generation/reset

## Domain Resolution Data Path (v1)
1. read incoming host
2. lookup `SiteDomain.domain`
3. resolve `TenantSite`
4. query tenant-scoped settings/services/content via `tenantSiteId`
5. render tenant customer-facing site

If no domain match exists, platform routes continue normally.

## Provisioning Data Behavior
When creating a subscriber site from setup request, system should create baseline tenant entities and a clean editable subscriber-site structure. Demo data is not copied by default; any draft import should be an explicit future option.
- Paid-order provisioning currently links `SetupRequest -> TenantSite`, creates or reuses a `SiteDomain` where a requested domain exists, creates/updates a `SubscriptionRecord`, and creates clean fulfilment `SiteProvisioningTask` rows.
- Stripe checkout/session/subscription identifiers remain on `SetupRequest`; `SubscriptionRecord` currently stores platform subscription amounts/status rather than provider secrets.
- Paid subscriber sites start with `CustomerSiteSettings` prefilled only from order-safe details such as business name, contact email and contact phone.
- Paid subscriber sites also get a tenant-scoped `CustomerSiteAdminUser` owner/admin access record so the business owner can reach `/site-admin/[siteSlug]` without platform-admin credentials.

## SiteDomain domain/DNS workflow fields
- `SiteDomain` remains the central custom-domain mapping record for each tenant site.
- The manual DNS/go-live workflow now stores explicit tracking fields alongside the existing `status` and `dnsInstructions` JSON:
  - `domainStatus`
  - `domainSetupMode`
  - `dnsStatus`
  - `sslStatus`
  - instruction/check/go-live timestamps
  - `domainNotes`
  - `expectedDnsTarget`
  - `expectedNameservers`
  - `lastDnsCheckResult`
- These fields are platform-admin operational state only. They do not purchase domains, change DNS, issue SSL, or call external DNS/provider APIs.
- `dnsInstructions` JSON is still used for email/copy metadata compatibility, including target instructions and last email delivery status.

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
- SiteDomain lookup now powers the custom-domain runtime proof path (`host -> SiteDomain -> TenantSite`) while `/sites/[siteSlug]` remains the platform fallback/proof route.

## Diagnostic endpoint
- Added `GET /api/site-resolve-debug` (platform-admin guarded).
- Supports temporary test header `x-test-site-host` for pre-domain-attachment validation.
- Returns safe proof fields: received host, normalised host, matched tenant/site slug, matched domain, domain/DNS/SSL status and route rewrite target.

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

## Persisted page/content + social media settings (tenant-scoped)
- `CustomerSiteSettings` now stores page/content and social settings per `tenantSiteId`:
  - Page visibility: `aboutPageEnabled`, `policyPageEnabled`.
  - About: `aboutPageMode`, `aboutTitle`, `aboutBody`, `aboutImageOneUrl`, `aboutImageTwoUrl`, `aboutImagePlacement`, `aboutStaffProfilesJson`.
  - Contact: `contactTitle`, `contactIntro`, `contactMapEnabled`, `contactMapNote`.
  - Policy: `policyTitle`, `policyIntro`, `policyBody`.
  - Social: `socialLinks` JSON with `facebook`, `instagram`, `tiktok`, `xTwitter`, `linkedin`, `youtube`.
- `Website` is not a supported social platform.
- About/Contact images remain placeholder URL fields only in this pass (no new media upload workflow).

## SetupRequest confirmation security fields
`SetupRequest` now includes:
- `confirmationTokenHash`
- `confirmationTokenCreatedAt`
- `confirmationTokenLastUsedAt`
- `confirmationAccessCount`

Notes:
- Plaintext token is not stored in database.
- Public confirmation lookups require a valid token that matches stored hash.
- Platform-admin reads remain session-authorized.

## ContactEnquiry model
`ContactEnquiry` fields:
- id (cuid)
- name
- businessName
- email
- phone
- industrySlug
- message
- source
- status (`NEW`, `REVIEWED`, `REPLIED`, `CLOSED`)
- createdAt
- updatedAt

Indexes:
- email
- status
- createdAt
- industrySlug

Notes:
- This model powers the public contact/support form.
- Transactional admin notification is now sent when email provider env is configured.

## Transactional email config (environment)
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `PLATFORM_NOTIFICATION_EMAIL`

Notes:
- Email body content is generated from server-side templates.
- Email provider failures do not block core record creation flows (fail-soft behavior).
- No email secrets are persisted in database models.

## Recurring and block-booking fields (CustomerSiteSettings, CustomerSiteService)
- CustomerSiteSettings additions:
  - ecurringPaymentsEnabled (Boolean)
  - customerBlockBookingsEnabled (Boolean)
- CustomerSiteService additions:
  - ecurringEnabled (Boolean)
  - ecurringIntervals (Json)
  - lockBookingEnabled (Boolean)
  - lockBookingSuggestedCounts (Json)
- No recurring payment transaction model/provider webhook model was added in this pass.

## SetupRequest Stripe fields (2026-05-30)
- paymentStatus (NOT_STARTED, CHECKOUT_STARTED, PAID, PAYMENT_FAILED, CANCELLED)
- paymentProvider (STRIPE)
- stripeCheckoutSessionId
- stripeCustomerId
- stripeSubscriptionId
- paymentStartedAt
- paymentCompletedAt
- No card PAN/CVC or other sensitive payment details are stored.

## Platform dashboard reporting sources (2026-05-30)
- /admin report tiles aggregate persisted data from: SetupRequest, TenantSite, SubscriptionRecord, ContactEnquiry, SalesLead.
- Payment Fails tile uses SubscriptionRecord failure status when available.
- Revenue by Industry currently reports current-state estimates from persisted site/subscription/order data; month-on-month history depends on fuller webhook/payment event capture.

## Sales pipeline data expansion (2026-05-30)
- SalesLead fields added: postcode, address, serviceArea, leadSource, sourceUrl, currentProvider, estimatedCurrentMonthlyCost, marketingStatus, unsubscribedAt, doNotContactReason.
- SalesLead campaign visibility added: pipelineVisibility defaults to READY_FOR_CAMPAIGN for existing/manual leads and supports RESEARCH, READY_FOR_CAMPAIGN, HIDDEN and DO_NOT_CONTACT.
- New models: SalesCampaign, SalesCampaignRecipient, SalesCampaignEvent for campaign lifecycle and future click/delivery event storage.
- Duplicate detection in import workflow is rule-based at app level (postcode+industry primary, plus business/postcode, email, phone checks).

## Sales lead URL import data (2026-06-11)
- New models: SalesLeadImportBatch and SalesLeadImportRow.
- SalesLeadImportBatch stores sourceType, defaultIndustrySlug, defaultCityTown, status, createdAt and updatedAt.
- SalesLeadImportRow stores sourceUrl, visible extracted fields, leadSource/currentProvider, editable estimatedCurrentMonthlyCost, industry/city defaults, duplicateReason, emailEnrichmentStatus, notes, raw metadata, and optional approvedLeadId.
- Import rows use review statuses: PENDING_REVIEW, APPROVED, SKIPPED, NEEDS_ENRICHMENT and DUPLICATE.
- Approval creates a SalesLead and links the import row to the approved lead. Imported rows default to RESEARCH visibility; rows missing email can still be saved as FOLLOW_UP with notes requiring email research.
- The model supports public/manual enrichment only; it is not a private-email scraping or campaign-sending system.
