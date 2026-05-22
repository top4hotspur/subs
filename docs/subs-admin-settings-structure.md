# Subs Admin Settings Structure (Local Mock)

## Purpose
`/admin/settings` is now split into focused sections to avoid a single long scrolling editor.
This page represents **business site settings** for an individual subscriber website, not platform-level admin settings.

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
- Industry selector remains visible at top.
- Only the active section is rendered.
- All data remains browser-local and mock-only.
- No backend/auth/API integration is implemented.
- Platform admin operational flows are managed separately in `/admin`, `/admin/setup-requests`, `/admin/sites`, and `/admin/sales`.
- Staff setup now uses business-configured role definitions.
- Notification templates are split by channel (Email / WhatsApp).
- Calendar preview now includes hourly staffing, 14-day forecast, and a long-term day-grid toggle.
- CRM is available in `/admin/crm` as a dedicated local customer panel built from local requests.

