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
- payment settings (`SitePaymentSettings`)
- cancellation policy (`SiteCancellationPolicySettings`)
- SEO (`SiteSeoSettings`)
- analytics (`SiteAnalyticsSettings`)

## Payment and cancellation defaults
- Card/pre-payment path is enabled by default.
- Cash payments are optional and admin-enabled.
- Default cancellation policy uses a 24-hour full-refund window.
- No real payment/refund integrations are active in this local/mock phase.

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

## Optional business pages and content modules (planned)
Subscriber business admins are expected to enable/disable pages and sections such as:
- About Us
- Contact
- Gallery
- Reviews
- Policies
- Gift Vouchers

Template-page model expectations (future):
- page title
- text/content blocks
- image placeholders
- CTA links

Gift voucher model placeholders now exist in:
- `src/lib/vouchers/voucher-types.ts`
with settings for voucher enablement, delivery methods, value range, postage charge, and redemption tracking metadata.

Local mock voucher helpers now also exist in:
- `src/lib/vouchers/local-vouchers.ts`
for browser-local issue/check/redeem demo workflows.


## Booking availability controls
- Service duration/buffer and role-price settings influence appointment demo slot behavior and customer-facing price labels.
- Ad hoc business closures are managed locally and reduce open booking day availability in demo booking pages.


## Local demo management enhancements
- Services can now be added/removed in demo business admin.
- Staff can now be added/removed with super-user and weekday-availability flags.
- Gift voucher setting inputs now clearly indicate GBP values (£).


## Compact editor layout updates
- Services now support compact card editing with durationMinutes and ufferAfterMinutes in the demo admin UI.
- Staff now uses business-created position dropdowns, replacing free-text as the primary position control.

