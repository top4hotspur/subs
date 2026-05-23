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


## Currency and social settings
- paymentSettings.currencyCode now drives local demo currency display for service/voucher/sales values.
- paymentSettings.allowInStorePaymentRecording controls staff in-store sale capture visibility.
- businessDetails.socialLinks now powers customer-facing social links when configured.
- Social platform list excludes `Website`; supported options are Facebook, Instagram, TikTok, X/Twitter, LinkedIn, YouTube.

## Appointment display controls
- appointmentSettings.appointmentSlotIntervalMinutes supports `15`, `30`, or `60` minute slot blocks.
- appointmentSettings.allowCustomerStaffSelection controls whether customers see preferred-staff selection in booking forms.


## Branding controls (local demo)
Business site settings demo now includes branding controls for:
- Site/page display name (text fallback)
- Logo local preview upload (PNG/SVG preferred)
  - Recommended dimensions: 512 x 512 (square icon) or 1200 x 400 (wide header)
  - Max file size: 1 MB
  - Transparent background recommended
- Favicon local preview upload (PNG/ICO preferred)
  - Minimum: 32 x 32
  - Recommended source: 512 x 512
  - Max file size: 512 KB

These uploads remain browser-local mock previews only (no backend media storage).

## Local page-content controls (demo)
- `pageVisibility` toggles for About and Contact now feed demo route behavior.
- `pageContent.about` and `pageContent.contact` now drive `/demo/[industry]/about` and `/demo/[industry]/contact` rendering.
- Image placement is modeled locally with placeholders; no real media storage pipeline is enabled.
- Branding assets (logo/favicon) remain local preview only with explicit removal controls.

## Visual template and colour controls (demo)
- `branding.visualTemplateId` controls the subscriber site visual layout.
- `branding.colourSchemeId` controls accent and surface palette.
- Available visual templates:
  - modern-minimalist
  - bold-edge
  - classic-immersive
  - utility-list
  - split-screen-contemporary
- Available colour schemes:
  - calm-blue
  - fresh-green
  - warm-coral
  - midnight-lime

These settings are local to browser storage in this phase.

Template/colour propagation notes:
- `branding.visualTemplateId` and `branding.colourSchemeId` are saved to local industry settings and applied on `/demo/[industry]`.
- Admin selectors in `/demo/[industry]/admin` persist changes immediately for local preview accuracy.
