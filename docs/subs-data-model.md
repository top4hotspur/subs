# Subs Data Model

## Core domains
- Templates: static industry template catalogue (`WebsiteTemplate`)
- Demo drafts: per-prospect local customisation (`DemoCustomisationDraft`)
- Setup requests: local mock subscription onboarding records
- Site settings: reusable per-site configuration (`CustomerSiteSettings`)
- Services/pricing: editable service catalogue (`SiteServiceItem`)
- Staff: team records + role metadata (`StaffMember`)
- Availability/calendar: business + staff windows + scheduling hints
- Customer requests/jobs: shared enquiry/booking/job model (`CustomerRequest`)
- Notification templates: editable message templates per industry/channel/event

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


## Local Analytics and Financials Preview
- Added browser-only analytics types and local summary builder under src/lib/analytics
- Metrics are derived from local requests, services, and staff data (no API/database)n- Income values are estimates only and should not be treated as accounting records

