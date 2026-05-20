# Subs Standard Site Settings

## Purpose
Define one reusable settings model that every customer website can use, regardless of industry template.
This is local/static/mock only and is not backend persistence.

## Settings model
Implemented in:
- `src/lib/sites/site-settings-types.ts`

Core object:
- `CustomerSiteSettings`

Key groups:
- branding (`SiteBrandingSettings`)
- business details (`SiteBusinessDetails`)
- page visibility (`SitePageVisibilitySettings`)
- homepage section visibility (`SiteSectionVisibilitySettings`)
- services (`SiteServiceItem[]`)
- legal (`SiteLegalSettings`)
- notifications (`SiteNotificationSettings`)
- SEO (`SiteSeoSettings`)
- analytics (`SiteAnalyticsSettings`)

## Notifications and templates
- Email notifications are included by default.
- WhatsApp add-on is optional (+£10/month).
- Template content is modeled separately in:
  - `src/lib/notifications/notification-types.ts`
  - `src/lib/notifications/local-notification-templates.ts`
- Template editor is available in `/admin/settings` (mock/local only).

## Local settings storage
Browser-only helper:
- `src/lib/sites/local-site-settings.ts`

Local key format:
- `subs-site-settings:<industrySlug>`

## What is not built yet
- No real file upload/storage for logos/images.
- No real auth/permissions.
- No DB persistence.
- No API endpoints.
- No production analytics integrations.
- No real notification delivery integration.


## UI defaults and brand fallback
- Default rendering now uses neutral theme surfaces and card/tile components for broad industry fit
- Text-based brand mark fallback remains first-class when no logo is present
- Customer colour customisation can be applied later without changing core local/mock platform behavior

