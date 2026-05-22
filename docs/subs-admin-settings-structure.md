# Subs Admin Settings Structure (Local Mock)

## Purpose
`/admin/settings` is now split into focused sections to avoid a single long scrolling editor.
This page represents **business site settings** for an individual subscriber website, not platform-level admin settings.
UI wording in admin now calls this area **Business Site Settings Demo**.

## Sections
- Analytics and financials
- Standard site settings
- Services / products / pricing
- Staff setup
- Availability & scheduling
- Staff rota & breaks
- Holidays and Closures
- Calendar preview (mock)
- Notification templates

## Notes
- Shared admin pill navigation now appears across admin pages:
  - `/admin`
  - `/admin/settings`
  - `/admin/sales`
  - `/admin/setup-requests`
  - `/admin/sites`
  - `/admin/crm`
- Industry selector remains visible at top.
- Only the active section is rendered.
- All data remains browser-local and mock-only.
- No backend/auth/API integration is implemented.
- Platform admin operational flows are managed separately in `/admin`, `/admin/setup-requests`, `/admin/sites`, and `/admin/sales`.
- Staff setup now uses business-configured role definitions.
- Notification templates are split by channel (Email / WhatsApp).
- Calendar preview now includes hourly staffing, 14-day forecast, and a long-term day-grid toggle.
- CRM is available in `/admin/crm` as a dedicated local customer panel built from local requests.
- `/admin/settings` route is preserved for compatibility and may later move under a subscriber/site-scoped settings route.
- Site-scoped business settings entry now exists at `/admin/sites/[siteId]/settings`.
- In this pass, `/admin/sites/[siteId]/settings` reuses the same local/mock settings tooling as the generic demo page and adds site context from persisted subscriber records.

