# Subs Site Portal Architecture

## v1 Deployment and Data Architecture
- One shared MyExperiment.club application serves all subscribers.
- One central Postgres/Neon database stores all subscriber data.
- Tenant isolation is implemented using `tenantSiteId` on site-scoped models.
- Custom domains map to a `TenantSite` and drive tenant resolution at request time.
- v1 does not create a full separate app/database per customer by default.

## Tenant Resolution Model
1. Request arrives with `host` header/domain.
2. Domain lookup checks `SiteDomain.domain`.
3. Matching record resolves `tenantSiteId` -> `TenantSite`.
4. Shared app loads tenant-scoped settings/services/content.
5. Customer-facing site is rendered for that tenant.
6. Unknown domains fall back to platform routes.

Domain handling notes:
- root + `www` handled by explicit mapping
- existing customer domains and newly registered domains both supported
- DNS/domain automation is phased later

## Platform Admin vs Subscriber Admin
Platform admin (MyExperiment.club):
- setup requests
- subscriber sites
- provisioning workflow
- sales/CRM operations

Subscriber business admin (tenant-owned operations):
- services/prices
- staff/roles/availability
- pages/content/policies
- vouchers/communications
- booking operations

## Current Persistence State
Persisted per `tenantSiteId`:
- site settings/branding/theme/currency
- services
- staff roles
- staff members
- scheduling: rota days, break windows, business closures, staff holidays

Still local/mock:
- vouchers
- pages/content/policy persistence for live tenant
- payment integration
- bookings/customers/accounts
- media storage

## Provisioning Workflow Entry Points
From `/admin/setup-requests` or `/admin/sites`:
- `Create subscriber site`
- `Start site setup`
- `Generate DNS instructions`
- `Mark site ready`
- `Mark site live`

## Manual Steps Still Expected in v1
- domain purchase/registration where managed for customer
- DNS/nameserver updates with customer/provider
- hosting custom-domain attachment checks
- payment/subscription confirmation
- final go-live review

## Future Exception Path
Per-customer isolated deployments/databases can be considered later only for exceptional enterprise/high-isolation requirements.
