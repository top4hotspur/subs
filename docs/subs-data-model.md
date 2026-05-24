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

All site-scoped models above are keyed/scoped by `tenantSiteId`.

## Not Persisted Yet (Current)
- vouchers
- page content blocks/modules
- policy content blocks/modules
- social media persistence
- booking/customer account persistence
- media/logo file storage
- payment provider integration data

## Domain Resolution Data Path (v1)
1. read incoming host
2. lookup `SiteDomain.domain`
3. resolve `TenantSite`
4. query tenant-scoped settings/services/content via `tenantSiteId`
5. render tenant customer-facing site

If no domain match exists, platform routes continue normally.

## Provisioning Data Behavior
When creating a subscriber site from setup request, system should create baseline tenant entities and copy available persisted setup/demo/services data where present, rather than manually building records from scratch.
