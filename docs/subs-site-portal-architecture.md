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
- `Create blank subscriber site`
- `Generate DNS instructions`
- `Mark site ready`
- `Mark site live`

Provisioning note:
- demo environments are sales/playground experiences
- live subscriber sites are provisioned clean and then completed with real business data

## Manual Steps Still Expected in v1
- domain purchase/registration where managed for customer
- DNS/nameserver updates with customer/provider
- hosting custom-domain attachment checks
- payment/subscription confirmation
- final go-live review

## Future Exception Path
Per-customer isolated deployments/databases can be considered later only for exceptional enterprise/high-isolation requirements.

## Persisted preview rendering route (platform-admin protected)
- New route: `/admin/sites/[siteId]/preview`.
- Uses persisted tenant-scoped records to render a customer-facing preview surface.
- This is an internal provisioning/support preview under platform-admin session, not public runtime routing.
- Public host/domain-based routing remains a later milestone.

## Persisted preview booking capability (internal)
- Added internal persisted booking route under admin preview context:
  - `/admin/sites/[siteId]/preview/booking`
- Customer-site public booking still relies on demo/local flows in this phase.
- Tenant-scoped persisted bookings now exist for platform-admin testing and provisioning support.

## Public tenant route before custom domains
- New public route `/sites/[siteSlug]` proves shared-app tenant rendering without domain middleware.
- Rendering path is the same conceptual flow as future domain routing:
  - host/slug -> tenant lookup -> tenant-scoped query -> customer-site render
- Future custom-domain runtime will swap slug lookup for `SiteDomain.domain` host lookup while keeping tenant-scoped rendering logic.

## Domain setup approaches (later automation)
1. Customer keeps DNS provider and adds target records.
2. MyExperiment.club manages Route 53 zone and customer updates nameservers.

No per-customer DB or code export is required for this model.

## Host/domain resolver preparation
- Shared app is now prepared with central host resolver logic (no middleware routing switch yet).
- Planned custom-domain flow:
  1. read request host
  2. normalize host
  3. resolve `SiteDomain.domain`
  4. resolve `TenantSite`
  5. render tenant-scoped customer site using same data model as slug route
- Root and `www` hosts are handled through resolver candidate matching.
- DNS and Amplify domain automation are still manual/out-of-scope in this phase.

## Business-owner access foundation (tenant-scoped)
- Added first subscriber business-owner auth path using dedicated site-admin login:
  - `/site-admin/login`
  - `/site-admin/[siteSlug]`
- Session model is separated from platform admin:
  - `roleType=SITE_ADMIN`
  - `tenantSiteId`, `tenantSlug`, `siteAdminUserId`, `siteAdminRole`
- Middleware now enforces route separation:
  - `/admin/*` requires platform-admin session only
  - `/site-admin/*` requires site-admin session only
- Site-admin users can access only their own tenant slug/site; cross-tenant access is blocked.
- Staff/customer auth is not included yet.

## Site-admin API expansion
- Added tenant-scoped business-owner APIs for staff and scheduling management under `/api/site-admin/[siteSlug]/*`.
- Route authorization enforces:
  - valid site-admin session
  - slug resolves to TenantSite
  - `session.tenantSiteId` must match resolved tenant id
- Platform admin APIs remain separate under `/api/admin/*`.
