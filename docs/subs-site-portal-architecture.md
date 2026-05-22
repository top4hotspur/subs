# Subs Site Portal Architecture (Future)

## Two-layer site model
### Customer/user layer
- view/manage bookings/requests where supported
- view confirmations and messages
- optional customer account features by industry

### Business owner/admin layer
- services/pricing management
- staff/team management
- business + staff availability management
- enquiries/bookings/jobs queue
- assignment and lifecycle actions
- notification templates (email + optional WhatsApp)
- analytics/financial views (future)

## Current local mock foundations
- services/pricing editor
- staff editor
- availability/calendar window editor
- request/job queue + assignment + status updates
- notification template editor + preview
- dedicated local CRM page (/admin/crm) from request history
- staffing forecast views (hourly + 14-day + long-term day grid)

All of the above are localStorage-only.

## Notification architecture note
Current notification template model supports:
- event-based templates
- email channel (included)
- WhatsApp channel (optional add-on)
- variable token replacement preview
- provider metadata placeholders (`LOCAL` / `TWILIO`, approval status, sync timestamp placeholder)

Not implemented yet:
- real delivery providers
- retry/delivery status logs
- customer preference center

## Future persistence model
Move to DB/API/auth:
- customer site settings/services
- staff + availability
- requests/jobs/status history
- notification templates + events + delivery logs
- role-based access and audit trails

## Platform sales pipeline
- Separate from `/admin/crm`, platform sales now has a dedicated `/admin/sales` area for outreach prospects.
- Persisted entities:
  - `SalesLead`
  - `SalesLeadEvent`
- This flow supports lead tracking, follow-up scheduling, country/city filters, CSV import/export, and outreach operations:
  - email template preview/copy/mark-sent
  - printable letters/flyers and envelopes
  - bulk print packs (letters first, envelopes second)
- No marketing email provider or unsubscribe enforcement is wired yet.

## Platform settings vs business site settings
- `/admin/settings` represents per-subscriber business site settings (services, staff, availability, templates).
- Platform admin operations are handled separately via setup queue, subscriber sites, and sales pipeline routes.
- Platform admin should not be treated as the day-to-day operator of subscriber business settings.
- Subscriber business admin owns operational tools: services/prices, staff/users/permissions, rotas, holidays, bookings/customers, vouchers, pages/content, notifications, and financial views.

## Platform admin vs subscriber admin wording
- `/admin` is treated as the platform operations area for MyExperiment.club.
- `/admin/settings` is intentionally labeled **Business Site Settings Demo** to avoid implying global platform controls.
- Future architecture should move these subscriber settings to a subscriber-scoped route (for example `/admin/sites/[siteId]/settings` or dedicated business-owner portal routes).
- `/admin/sites/[siteId]/settings` is currently a support/provisioning preview and not a final business-owner operational portal.

## Future portal layers (planned)
- Customer login: bookings, payments, vouchers, profile.
- Staff login: appointments, telephone/manual bookings, voucher check and redeem.
- Business admin login: services, staff, rota, pages/content, vouchers, notifications, and financial controls.

See also:
- `docs/subs-business-owner-admin-model.md`

## Demo route alignment (current mock UX)
- `/demo/[industry]` now focuses on public customer-facing site presentation.
- Booking flow is separated into `/demo/[industry]/booking` instead of inline home-page forms.
- Mock customer/staff/business-admin portal routes are split for clearer product boundaries:
  - `/demo/[industry]/account`
  - `/demo/[industry]/staff`
  - `/demo/[industry]/admin`


## Local Analytics Layer (Current Mock State)
- The admin layer now includes a local analytics/financial preview built from browser-stored requests/services/staff
- No external analytics provider, accounting connector, or payment settlement integration exists yet
- Future architecture should move this logic to backend analytics services with tenant-scoped data access




## Flexible job architecture note
- Flexible-job industries share one request model with optional job-context fields instead of separate per-industry schemas.
- Future backend work should add quote lifecycle state, route planning, and workload/capacity controls on top of this shared model.

