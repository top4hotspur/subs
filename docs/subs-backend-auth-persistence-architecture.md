# Subs Backend/Auth/Persistence Architecture

## Scope and constraints
This document defines a safe v1 architecture path to move Subs from browser-local mock persistence to a hosted product.

Current constraints for this planning stage:
- No AWS resources provisioned in code yet
- No Cognito setup yet
- No DB/API implementation yet
- No Stripe/Twilio live integrations yet
- Existing product behavior remains local/mock

## Executive recommendation (v1)
Use a **single shared multi-tenant app** with strict tenant scoping, backed by a relational database, with app-level RBAC.

Recommended v1 stack:
1. Frontend/runtime: existing Next.js app
2. Auth: NextAuth/Auth.js with a relational adapter (business users first)
3. Persistence: Postgres (managed), one shared database, tenant-keyed tables
4. Server model: Next.js route handlers + server actions (thin service/repository layer)
5. Isolation: mandatory `siteId`/`tenantId` scoping on every read/write, enforced in repository and policy guards

This gives fastest path to paid customers while avoiding long-term data isolation mistakes.

---

## 1) Deployment model: multi-tenant vs per-site

### A) One shared app + tenant/site ID (recommended v1)
Pros:
- Fastest development and rollout
- Lowest operational cost early
- Easier central admin, support, analytics, upgrades
- One codebase and one deployment lifecycle

Cons:
- Requires disciplined tenant isolation guardrails
- Schema and query design must be tenant-first from day one

### B) Separate deployment per customer site
Pros:
- Hard isolation by deployment boundary

Cons:
- High operational overhead
- Slower feature rollout across customers
- Costly and brittle at scale

### C) Hybrid (central platform + generated customer sites)
Pros:
- Can optimize customer-facing site hosting later
- Central operations/admin stays unified

Cons:
- More moving parts; premature for first backend milestone

### Recommendation
Start with **A (shared multi-tenant)**. Keep design compatible with **C** later if/when static site generation or per-site hosting becomes commercially necessary.

---

## 2) Auth model recommendation

User classes:
1. Platform owner/admin
2. Business owner/admin
3. Business staff
4. End customer

### Options considered
- Cognito: strong managed auth, but more setup and complexity immediately
- Amplify Auth: good with Amplify-first stacks, but not required for fastest path in current app
- Custom auth: risky, security burden, not recommended
- NextAuth/Auth.js: fast integration with Next.js, good incremental rollout

### Recommended v1 auth
Use **NextAuth/Auth.js** first for platform + business users.

Why:
- Fastest implementation in current architecture
- Easy session handling in route handlers/server actions
- Works well with relational DB adapters
- Allows phased role onboarding

Suggested rollout:
- v1a: platform admin + business owner/admin auth only
- v1b: staff login with limited role permissions
- v2: optional end-customer accounts (can defer while request/booking is request-led)

---

## 3) Proposed v1 data model
All domain entities must include an ownership scope field (usually `siteId`) except platform-global records.

### Core tenancy/auth

#### TenantSite
- Key fields: `id`, `slug`, `businessName`, `industrySlug`, `status`, `createdAt`, `updatedAt`
- Scope: top-level tenant boundary
- Relations: has many users, services, staff, requests, CRM, settings
- LocalStorage equivalent: distributed local keys by industry
- Migration note: map current `templateSlug/industrySlug` local records to `siteId`

#### User
- Key fields: `id`, `email`, `name`, `phone`, `authProviderId`, `status`
- Scope: platform-level identity
- Relations: user-to-site membership table
- Local equivalent: none (mock only)

#### UserSiteRole
- Key fields: `id`, `userId`, `siteId`, `role`, `active`
- Scope: site-specific permissions
- Relations: links user to tenant with role

### Demo/setup funnel

#### DemoDraft
- Key fields: `id`, `siteId?`, `templateSlug`, `draftName`, `configJson`, `createdAt`, `updatedAt`
- Scope: pre-tenant or tenant-linked
- Local equivalent: `subs-demo-draft:*` keys
- Migration: keep browser drafts initially; backend drafts for setup handoff first

#### SetupRequest
- Key fields: `id`, `siteId?`, `industrySlug`, `businessName`, `domainOption`, `communicationOption`, contact fields, totals, `status`, `createdAt`, `updatedAt`
- Scope: tenant onboarding
- Local equivalent: `subs-setup-requests`
- Migration: phase 1 primary target

### Site configuration

#### CustomerSiteSettings
- Key fields: `id`, `siteId`, branding/business/page/section/legal/seo/notification/analytics/payment-policy JSON, timestamps
- Scope: site
- Local equivalent: `subs-site-settings:<industry>`

#### SiteServiceItem
- Key fields: `id`, `siteId`, `name`, `description`, `basePriceGbp`, `priceLabel`, `durationMinutes`, `bufferAfterMinutes`, `active`, pricing override JSON
- Scope: site
- Local equivalent: service array in site settings

#### StaffRoleDefinition
- Key fields: `id`, `siteId`, `label`, `platformRole?`, `active`
- Scope: site
- Local equivalent: `subs-staff-roles:<industry>`

#### StaffMember
- Key fields: `id`, `siteId`, `displayName`, `roleId?`, `roleLabel`, contact, `customerSelectable`, `active`, service links
- Scope: site
- Local equivalent: `subs-staff:<industry>`

### Scheduling

#### StaffRotaDay
- Key fields: `id`, `siteId`, `staffId`, `weekday`, `working`, `startTime`, `endTime`
- Scope: site
- Local equivalent: `subs-staff-rota:<industry>`

#### StaffBreakWindow
- Key fields: `id`, `siteId`, `staffId`, `weekday`, `startTime`, `endTime`, `active`
- Scope: site
- Local equivalent: nested in rota data

#### BusinessClosureDate
- Key fields: `id`, `siteId`, `date`, `allDay`, `startTime?`, `endTime?`, `label`, `active`
- Scope: site
- Local equivalent: `subs-business-closures:<industry>`

#### StaffHolidayDate
- Key fields: `id`, `siteId`, `staffId`, `date`, `allDay`, `startTime?`, `endTime?`, `label`, `active`
- Scope: site
- Local equivalent: `subs-staff-holidays:<industry>`

### CRM and operations

#### CustomerRecord
- Key fields: `id`, `siteId`, `name`, `email`, `phone`, `notes`, `tags`, booking counters, timestamps
- Scope: site
- Local equivalent: `subs-crm-customers`

#### CustomerRequest
- Key fields: `id`, `siteId`, request kind/status/pricing status, customer contact, service, schedule, location, staff refs, notes/extra fields, taxi/flexible-job fields, timestamps
- Scope: site
- Local equivalent: `subs-customer-requests`

### Messaging/notifications

#### NotificationTemplate
- Key fields: `id`, `siteId`, `eventType`, `channel`, `enabled`, `subject`, `body`, `tone`, `variables`, provider metadata
- Scope: site
- Local equivalent: `subs-notification-templates:<industry>`

#### NotificationEventLog
- Key fields: `id`, `siteId`, `requestId?`, `eventType`, `channel`, `status`, `providerMessageId?`, `sentAt`, payload
- Scope: site
- Local equivalent: none (currently implicit timestamps)

### Analytics/billing/provisioning placeholders

#### AnalyticsEvent (or summary tables)
- Key fields: `id`, `siteId`, `eventType`, `entityType`, `entityId`, metric payload, `createdAt`
- Scope: site
- Local equivalent: computed summaries only

#### SubscriptionBilling
- Key fields: `id`, `siteId`, plan fields, setup fee status, monthly status, whatsapp addon flag, domain fee flag, invoice/payment references
- Scope: site
- Local equivalent: none

#### DomainProvisioningStatus
- Key fields: `id`, `siteId`, `domainOption`, `domainName`, status, DNS instructions/checks, timestamps
- Scope: site
- Local equivalent: setup request domain fields

---

## 4) Persistence choice (v1)

### DynamoDB
Pros: scalable, serverless
Cons: more design friction for relational CRM/booking/staff queries; higher complexity for rapid feature changes

### Postgres (managed) (recommended v1)
Pros:
- Strong fit for relational tenant model
- Easier querying/reporting for bookings/CRM/history
- Faster iteration for complex admin workflows
- Works well with NextAuth adapters and migration tooling

Cons:
- Requires schema/migration discipline

### Amplify Data/AppSync
Pros: integrated tooling
Cons: adds abstraction complexity; less direct control for current pace

### Supabase/external
Pros: fast startup
Cons: external coupling and potential migration later if infra strategy is AWS-centric

### Recommendation
Use **managed Postgres** for v1 persistence.

---

## 5) API/server model
Recommended v1:
- Next.js route handlers for explicit API boundaries
- Server actions for tightly-coupled form mutations where appropriate
- Shared service/repository layer to enforce tenant scoping

Avoid starting with AppSync for v1.

---

## 6) Tenant isolation guardrails
Every read/write must include and verify:
- `siteId` (primary tenant boundary)
- `userId` and role membership
- optional `customerId` where customer access is introduced

Guardrails:
1. Never query by entity ID alone; always query by `(siteId, entityId)`
2. Middleware/session guard resolves `currentSiteId` and role before handlers
3. Repository APIs require `siteId` argument (no optional scope)
4. Add audit fields: `createdBy`, `updatedBy` on mutable entities
5. Add tests for cross-tenant access denial

Risk if skipped: silent tenant data leakage.

---

## 7) Staged migration from localStorage

### Phase 1 (recommended first)
- Persist setup requests + demo draft handoff to backend
- Keep browser demo editing local for now
- Add platform admin view over persisted setup queue

### Phase 2
- Add business-owner auth
- Persist CustomerSiteSettings/services/staff/roles

### Phase 3
- Persist customer requests/bookings/jobs + CRM
- Move admin queue and calendar inspection to backend-backed reads

### Phase 4
- Notification dispatch pipeline + billing integration placeholders to real providers

### Phase 5
- Domain/provisioning workflows, ops automation, deeper tenant lifecycle

---

## 8) Smallest safe first backend milestone
Recommended first milestone:
1. Auth for platform owner + business owner/admin
2. Persist `SetupRequest` and `DemoDraft` linkage
3. Create `TenantSite` on approved setup request
4. Minimal admin queue with tenant-safe reads/writes

Why this first:
- Direct commercial impact (lead -> setup pipeline)
- Minimal blast radius vs full booking engine
- Establishes tenant/auth foundations before expanding data surfaces

---

## 9) Key risks and mitigations

1. Auth complexity creep
- Mitigation: start with two roles only; expand incrementally

2. Tenant leakage
- Mitigation: mandatory site-scoped repositories + authorization tests

3. Payment timing confusion
- Mitigation: keep billing as status placeholders until payments are intentionally introduced

4. Twilio WhatsApp approval path
- Mitigation: keep template metadata now; provider sync only after backend credentials + approval flow

5. Domain provisioning complexity
- Mitigation: start as tracked status workflow before automation

6. localStorage migration integrity
- Mitigation: migrate entity-by-entity, maintain read fallback during transition windows

7. Privacy/GDPR
- Mitigation: data minimization, retention policy, deletion/export planning from v1 schema design

8. Overbuilding before paying customers
- Mitigation: phase by revenue-critical workflow (setup -> tenant creation -> admin operations)

---

## 10) Suggested v1 implementation order
1. Tenant + auth foundation
2. Setup request persistence + workflow
3. Site settings/services/staff persistence
4. Customer requests + CRM persistence
5. Notifications/billing integrations

This keeps the platform commercially usable early while reducing architecture rework risk.
