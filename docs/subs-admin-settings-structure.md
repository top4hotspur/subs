# Subs Admin Settings Structure (Local Mock)

## Purpose
`/admin/settings` is now split into focused sections to avoid a single long scrolling editor.

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
- Staff setup now uses business-configured role definitions.
- Notification templates are split by channel (Email / WhatsApp).
- Calendar preview now includes hourly staffing, 14-day forecast, and a long-term day-grid toggle.
- CRM is available in `/admin` as a local customer panel built from local requests.
