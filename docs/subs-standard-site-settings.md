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

## Payment processor setup intent (local mock)
- `paymentSettings.paymentProcessorSetupMode`:
  - `EXISTING_PROCESSOR`
  - `NEED_HELP_SETUP`
  - `MANUAL_RECORDING_ONLY`
- Optional local notes fields:
  - `paymentSettings.existingProcessorName`
  - `paymentSettings.processorSetupNotes`
- This captures setup intent only; no real payment processor integration is enabled in this phase.


## Branding controls (local demo)
Business site settings demo now includes branding controls for:
- Site/page display name (text fallback)
- Hero headline text (editable from business admin and reflected on `/demo/[industry]`)
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

## Theme and palette controls (demo)`r`n- `branding.visualTemplateId` now maps to the controlled theme system:`r`n  - modern-minimalist`r`n  - vintage-classic`r`n  - urban-hipster`r`n  - luxury-elegant`r`n  - rustic-warm`r`n- `branding.colourSchemeId` now maps to curated per-theme palettes (3 per theme).`r`n- Admin `Site design` UI filters palette options to the selected theme.`r`n- No free colour picker is exposed in launch configuration.`r`n`r`nBackward compatibility:`r`n- legacy template IDs are normalized (bold-edge/classic-immersive/utility-list/split-screen-contemporary).`r`n- legacy colour IDs are normalized (calm-blue/fresh-green/warm-coral/midnight-lime).`r`n`r`n## Demo policy settings (local)
- `CustomerSiteSettings.policySettings` now captures cancellation/refund notice rules for demo site policy rendering.
- `branding.heroHeadline` and optional `branding.heroSubheading` can be managed from business admin and reflected on `/demo/[industry]`.


## Additional page-content settings (demo/local)
- pageVisibility.policy controls demo policy route visibility and nav exposure.
- pageContent.about.mode supports GENERAL and STAFF_PROFILES rendering modes.
- pageContent.about.imageUrlSecondary supports a second about-image placeholder.
- pageContent.about.staffProfiles[] stores local profile content for staff-profile mode.
- pageContent.contact.showGoogleMapsLinkFromAddress controls address-based Google Maps link display.
- pageContent.policy stores editable policy page title/body content.

Maps/media limitations:
- Google Maps integration is link-only (query URL) with no API key.
- About/profile image fields are placeholder/local inputs only (no real file storage pipeline).

## Payment setup intent fields (demo/local)
paymentSettings now includes additional setup-preparation fields:
- processorProvider: STRIPE | SQUARE | SUMUP | PAYPAL | WORLDPAY | ZETTLE | OTHER
- merchantReference: account email or merchant reference text
- existing setup mode and notes fields remain

No real provider credentials/API keys are stored or connected in this phase.

## Contact page visibility rule
- pageVisibility.contact is normalized to enabled=true in local settings.
- Contact is standard; About/Policy are optional buildable pages.

## Contact/About/Policy visibility rule update
- Contact page is standard and always visible in demo-site navigation.
- About and Policy remain optional buildable pages controlled by visibility toggles.

## Social media icons (local static assets)
- Customer-facing social links now use local PNG assets from `public/icons/social`.
- Supported visible platforms:
  - Facebook
  - Instagram
  - TikTok
  - X / Twitter
  - LinkedIn (text fallback badge when icon asset is not present)
  - YouTube
- Social links render only when enabled and a URL is present.
- Links open in a new tab (`target="_blank"`, `rel="noreferrer"`).
- Website is not included as a social platform option.

## Persisted content/social defaults
- Contact page is standard and should always be treated as available.
- About and Policy visibility are persisted via `aboutPageEnabled` and `policyPageEnabled`.
- Social platforms in persisted settings:
  - Facebook
  - Instagram
  - TikTok
  - X / Twitter
  - LinkedIn
  - YouTube
- Icons are served from `/public/icons/social` and rendered as accessible link buttons.
- `Website` is not included as a social platform.

## 2026-05-30 update: appearance and social presentation
- Subscriber-facing appearance control is now `Light`/`Dark` only.
- Existing internal `visualThemeId` and `colourPaletteId` values are still used under the hood via fixed mapping.
- Social platform links continue to use persisted URLs/settings and now render with clean icon presentation (no forced dark circular wrapper).
- Homepage hero booking CTA is intentionally not rendered; service cards remain the primary booking action.

## 2026-05-30 demo voucher route update
- Customer-facing demo vouchers now use a dedicated purchase route: `/demo/[industry]/vouchers`.
- Voucher confirmations include a locally generated voucher reference and delivery method.
- Payment is not processed in demo mode; checkout/payment remains informational.

## Recurring and block-booking foundation fields
- Site-level settings now include:
  - recurring payments/services enabled
  - customer block bookings enabled
- Service-level settings now include:
  - recurring enabled
  - recurring intervals (WEEKLY, MONTHLY, ANNUALLY)
  - block booking enabled
  - suggested block counts
- This pass stores configuration only; no provider-driven recurring billing is active.
