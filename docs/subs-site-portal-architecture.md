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


## Local Analytics Layer (Current Mock State)
- The admin layer now includes a local analytics/financial preview built from browser-stored requests/services/staff
- No external analytics provider, accounting connector, or payment settlement integration exists yet
- Future architecture should move this logic to backend analytics services with tenant-scoped data access


