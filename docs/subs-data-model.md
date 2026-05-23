# Subs Data Model

## Core domains`r`n- Industry catalogue: 14 launch industries (including tutors and bus-hire)`r`n
- Templates: static industry template catalogue (`WebsiteTemplate`)
- Demo drafts: per-prospect local customisation (`DemoCustomisationDraft`)
- Setup requests: local mock subscription onboarding records
- Site settings: reusable per-site configuration (`CustomerSiteSettings`)
- Services/pricing: editable service catalogue (`SiteServiceItem`)
- Staff: team records + role metadata (`StaffMember`)
- Availability/calendar: business + staff windows + scheduling hints
- Customer requests/jobs: shared enquiry/booking/job model (`CustomerRequest`)
- Notification templates: editable message templates per industry/channel/event
- Sales pipeline: prospect and outreach tracking (`SalesLead`, `SalesLeadEvent`)

## UI display helpers
Centralized display formatting is defined in:
- `src/lib/ui/display-labels.ts`

Request badge component:
- `src/components/requests/request-status-badge.tsx`

## Local storage keys
- `subs-demo-drafts:index`
- `subs-demo-draft:<draftId>`
- `subs-active-demo-draft:<industrySlug>`
- `subs-setup-requests`
- `subs-site-settings:<industrySlug>`
- `subs-staff:<industrySlug>`
- `subs-business-availability:<industrySlug>`
- `subs-staff-availability:<industrySlug>`
- `subs-customer-requests`
- `subs-notification-templates:<industrySlug>`

Current persistence is intentionally browser-only mock storage.

## Persisted sales pipeline (backend)
- Sales pipeline data is persisted in Postgres for platform-admin workflows:
  - `SalesLead`
  - `SalesLeadEvent`
- This model is distinct from local customer CRM (`subs-crm-customers`).


## Local Analytics and Financials Preview
- Added browser-only analytics types and local summary builder under src/lib/analytics
- Metrics are derived from local requests, services, and staff data (no API/database)n- Income values are estimates only and should not be treated as accounting records



## Local CRM
- Customer CRM model is browser-local and available at /admin/crm.
- Matching priority: email, then phone, then name.
- Source keys: subs-customer-requests and subs-crm-customers.



## Demo CSV alignment note
Service CSV import/export for demo business-admin now aligns with service editor shape:
- serviceName
- basePrice
- durationMinutes
- bufferAfterMinutes
- description
- optional rolePrice:<role label> fields

## Persisted subscriber-site settings models (Postgres)
Added Prisma models:
- CustomerSiteSettings
  - unique per TenantSite (`tenantSiteId`)
  - stores basic display/contact/theme/currency fields
- CustomerSiteService
  - many per TenantSite
  - stores service name/description/price/duration/buffer/active/sortOrder/rolePriceOverrides

Indexes/relations:
- CustomerSiteSettings.tenantSiteId unique FK -> TenantSite
- CustomerSiteService indexed by tenantSiteId, active, sortOrder
