# Subs First Backend Milestone Plan

## Architecture Baseline (v1)
- Shared application runtime for all subscriber sites.
- Single central Postgres/Neon database.
- Tenant scoping via `tenantSiteId` for site-scoped records.
- Domain-based tenant resolution through `SiteDomain`.
- No default per-customer code export or per-customer database.

## Create Subscriber Site Workflow (Target)
From `/admin/setup-requests` or `/admin/sites`:
1. Click `Create subscriber site` / `Start site setup`.
2. Create/link `TenantSite` from setup request.
3. Create `SiteDomain` record.
4. Create `SubscriptionRecord` placeholder.
5. Create default provisioning tasks.
6. Copy persisted demo/settings when available.
7. Copy persisted services/pricing when available.
8. Copy staff/roles/rota/settings in later milestones as those modules become persisted.
9. Generate and share DNS instructions.
10. Track lifecycle statuses until live.

Target statuses:
- `SETUP_REQUESTED`
- `PAYMENT_PENDING`
- `DOMAIN_DETAILS_REQUIRED`
- `DNS_INSTRUCTIONS_SENT`
- `SITE_PROVISIONING`
- `SITE_READY`
- `SITE_LIVE`

## Domain Routing Model (v1)
- Resolve incoming host/domain against `SiteDomain.domain`.
- Use mapped `tenantSiteId` to load tenant-scoped data.
- Render subscriber site from shared app.
- Fall back to platform routes for unmatched hosts.

Also support:
- root + `www` mapping
- existing domain onboarding and new-domain onboarding
- manual DNS setup first, automation later

## Manual Work Remaining in Early v1
- registering/purchasing customer domains where managed by us
- customer DNS/nameserver changes
- custom-domain attachment steps in hosting
- payment/subscription confirmation
- final content checks before go-live

Note:
- records should be created by workflow actions, not hand-built manually in DB.

## Automation Roadmap
Phase 1:
- persisted setup requests
- TenantSite creation
- provisioning checklist

Phase 2:
- copy persisted demo/settings/services/staff into site
- DNS/domain instruction generator

Phase 3:
- custom-domain status checks
- payment/subscription status tracking
- subscriber business-owner auth

Phase 4:
- optional domain/provider automation where practical
- automated provisioning pipeline
- optional per-customer deployment only when required

## Admin Wording Standard
Use these labels consistently:
- `Create subscriber site`
- `Start site setup`
- `Generate DNS instructions`
- `Mark site ready`
- `Mark site live`

## Current Delivery State
Already persisted:
- setup requests and provisioning entities
- tenant site settings/services
- tenant staff roles/staff members
- tenant scheduling (rota, breaks, closures, holidays)

Not persisted yet (remain local/mock):
- vouchers
- page content modules
- policy content modules
- social media persistence
- booking/customer accounts persistence
- media/logo storage
- payment provider integration

## New milestone: persisted customer-facing render proof
- Added backend-aware route `/admin/sites/[siteId]/preview` to validate persisted rendering.
- Route reads persisted site settings/services/staff/scheduling in one tenant-scoped repository call.
- This proves shared-app + central-DB + `tenantSiteId` model can drive customer-site output without local demo data.
- Not included yet:
  - custom domain host routing
  - persisted booking writes
  - subscriber business-owner auth
