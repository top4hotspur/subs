# Subs Site Provisioning Workflow (Persisted v1)

This workflow turns a persisted setup request into a persisted subscriber site record.

## Scope
- Persisted model + admin workflow only.
- No AWS provisioning, no domain automation, no website generation.
- No Auth.js yet (temporary admin header guard).

## Flow
1. Setup request is submitted and persisted.
2. Platform admin opens `/admin/setup-requests`.
3. Platform admin clicks **Start site setup** for a setup request.
4. Backend creates/returns a `TenantSite` linked to that setup request.
5. Backend also creates:
- subscription placeholder (`SubscriptionRecord`)
- initial domain record when domain value exists
- default provisioning checklist tasks
- status event timeline entry
6. Platform admin uses `/admin/sites` to monitor and update provisioning checklist task states.

## Status and task model
- Site status fields: provisioning status, domain status, subscription status.
- Domain model tracks status and instructions metadata (persisted only).
- Provisioning tasks are checklist items (`TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`, `SKIPPED`).

## Temporary admin guard
- API routes use `x-platform-admin-email` + `PLATFORM_ADMIN_EMAILS` allowlist.
- This is temporary until Auth.js role-based protection is added.

## Not implemented yet
- Route53/Amplify/custom-domain automation.
- Real customer website deployment/provisioning.
- Stripe billing activation.
- Email/Twilio notifications.
- Auth.js role/session hardening.

## Migration state note (Neon dev DB)

- Initial persistence tables already existed before provisioning migration deploy.
- Baseline strategy used:
  - mark initial migration as applied with `prisma migrate resolve`
  - deploy pending provisioning migration with `prisma migrate deploy`
- No reset/drop/destructive operations were used.

## Admin UX update: setup request -> subscriber site deep link

- `/admin/setup-requests` now shows a clear success panel after **Start site setup**.
- The success panel includes direct navigation to the created/existing site using:
  - `/admin/sites?siteId=<siteId>`
- This removes manual copy/paste of site IDs during provisioning.

## Admin sites query behavior

- `/admin/sites` supports `?siteId=<id>`.
- When provided, the page auto-selects that site after loading persisted site list.

## Site-scoped business settings handoff

- Selected subscriber sites now include a direct action to open:
  - `/admin/sites/[siteId]/settings`
- This route is labeled as a **subscriber settings preview/support view** for that site.
- Current implementation still uses local/mock settings tooling; persisted per-site settings storage remains a later milestone.
- Platform admin is not the normal operator of subscriber site settings in the target architecture.
- Live operational settings ownership belongs to the subscriber business admin portal.
- The site-scoped settings preview route should be treated as support/provisioning visibility, not day-to-day subscriber operations tooling.


## Provisioning admin security update

- `/admin/setup-requests` and `/admin/sites` now require platform-admin session.
- Setup request "Start site setup" still creates/links tenant site, but via authenticated admin APIs.
- Domain/DNS tracking remains manual; no automation added.

## Security note for provisioning admin flow

- Start site setup and provisioning updates now require authenticated platform-admin session.
- `/admin/sites?siteId=<id>` deep-link behavior remains in place after authenticated navigation.
- No real domain automation, Stripe, or messaging integration in this milestone.

## Persisted subscriber settings (first narrow backend step)
- Subscriber-site records can now store initial persisted settings and services under a selected TenantSite.
- Persisted section is available at `/admin/sites/[siteId]/settings`.
- This editor is support/provisioning-focused until subscriber business-owner auth is introduced.

Persisted now:
- site display/branding basics
- visual theme id and colour palette id
- currency
- services (name, description, basePrice, duration, bufferAfter, active, sortOrder, rolePriceOverrides JSON)

Still local/mock in this phase:
- staff, rota, closures, vouchers, pages/policies content, payments integration, files/logos, customer bookings/accounts.

## Persisted staff and roles (narrow milestone)
- `/admin/sites/[siteId]/settings` now includes a persisted staff/roles section tied to TenantSite.
- Platform-admin session is used for support/provisioning editing in this phase.

Persisted now:
- staff role definitions (label, platformRole, active, sortOrder)
- staff members (role linkage, contact fields, active/customerSelectable/isSuperUser, availableWeekdays, notes, sortOrder)

Current delete/deactivation behavior:
- deleting a role clears `roleId` for linked staff and preserves `roleLabel` fallback text.

Still local/demo in this phase:
- rota/breaks/holidays/closures and other business-owner modules.
