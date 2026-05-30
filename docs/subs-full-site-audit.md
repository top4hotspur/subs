# Subs Full Site Audit

## 1. Executive Summary
MyExperiment.club has a strong foundation with clear multi-tenant architecture, persisted subscriber data layers, and protected platform/site-admin boundaries. The main blocker is not backend capability; it is **journey consistency** between marketing, demo exploration, setup flow, and legacy mock routes.

The highest-risk gaps are conversion/clarity issues: legacy customiser messaging still acting as a primary path, public-facing mock language, and overlapping route concepts (`/account` global mock vs site-scoped account, demo vs persisted public site).

## 2. Overall Readiness Verdict
**Verdict: PARTIALLY READY (Pre-beta)**
- Architecture and core persisted foundations: strong.
- Sales/demo/setup journey clarity: inconsistent.
- Live public subscriber-site UX via `/sites/[siteSlug]`: functional but still basic.
- Security posture for admin/site-admin APIs: generally good with one known hardening item.

## 3. Route Coverage Audited
### Public/marketing
- `/`
- `/[industry]` (spot checked via code for all generated slugs)
- `/setup/[industry]`
- `/setup/confirmation`
- `/account` (legacy global mock portal)

### Demo routes
- `/demo/[industry]`
- `/demo/[industry]/booking`
- `/demo/[industry]/account`
- `/demo/[industry]/staff`
- `/demo/[industry]/admin`
- `/demo/[industry]/about`
- `/demo/[industry]/contact`
- `/demo/[industry]/policy`
- `/demo/[industry]/customise`

### Persisted/public tenant routes
- `/sites/[siteSlug]`
- `/sites/[siteSlug]/booking`
- `/sites/[siteSlug]/about`
- `/sites/[siteSlug]/contact`
- `/sites/[siteSlug]/policy`

### Admin/site-admin routes
- `/admin/*` (sites, setup requests, preview, settings)
- `/site-admin/login`
- `/site-admin/[siteSlug]`

## 4. Critical User Journeys
### Journey A: Landing -> demo -> setup
- Status: **Partially working**
- What works:
  - Homepage value proposition and pricing are clear.
  - Category-first industry browser exists.
  - Demo intro banner includes “Get your site now” linking to setup.
- Gaps:
  - Industry page CTA still pushes `Create my own site` to `/demo/[industry]/customise` as a primary path.
  - `/demo/[industry]/customise` still contains legacy “create my own site” and mock login placeholders.

### Journey B: Demo exploration confidence
- Status: **Partially working**
- What works:
  - Demo nav uses explicit high-contrast active/inactive classes.
  - Platform header/footer are hidden on `/demo/*`, reducing accidental platform-admin leakage.
  - Demo subpages use shared shell (`DemoSitePageShell`) with intro + nav + CTA.
- Gaps:
  - Root demo page (`/demo/[industry]`) uses a different composition than subpages; intro consistency is close but not fully unified.
  - Blue “draft” explanatory box appears only in the root demo preview state, not across all demo subpages.

### Journey C: Setup submission -> provisioning
- Status: **Working (with honest fallback)**
- What works:
  - Setup form validates domain options and contact details.
  - Backend submit exists (`POST /api/setup-requests`) with local fallback when backend unavailable.
  - Copy now states live subscriber site is clean/blank-ready.
- Gaps:
  - No payment checkout flow yet (expected, but should be framed consistently as pending step).

### Journey D: Subscriber operational management (persisted)
- Status: **Partially working to working depending area**
- What works:
  - Site-admin auth exists and is tenant-scoped.
  - Site-admin can manage persisted settings/services/staff/scheduling and now page/content/social.
  - Public `/sites/[siteSlug]` consumes persisted data.
- Gaps:
  - Business-owner experience still mixed with “mock” terminology in some areas of broader app.

## 5. Feature Wiring Table
| Feature | Current Status | Route/Component | Risk | Next Step |
|---|---|---|---|---|
| Homepage value proposition | Working | `src/components/marketing/marketing-home.tsx` | Low | Minor copy polish only |
| Industry category browser | Working | `industry-category-browser.tsx` | Low | UX telemetry later |
| Demo browsing | Working | `/demo/[industry]` + `DemoPreview` | Medium | Unify root/subpage explanation pattern |
| Demo nav readability | Working | `demo-site-nav.tsx` | Medium | Regression tests/screenshots |
| Demo “Get your site now” CTA | Working | `demo-site-intro-banner.tsx` | Low | Keep on all demo pages |
| Demo save/customisation flow | Partially working/confusing | `/demo/[industry]/customise`, `demo-customizer.tsx` | **High** | Demote/replace legacy customiser flow |
| Booking submit in demo | Working (local) | `customer-request-form.tsx` | Medium | Connect to persisted public flow later |
| Booking confirmation visibility | Working | `customer-request-form.tsx` | Low | Keep focus/scroll behavior |
| Demo My Account bookings/cancel | Working (local) | `demo-account-page.tsx` | Medium | Align with persisted model later |
| Staff View (demo operations) | Partially working (local) | `demo-staff-page.tsx` | Medium | Clarify local vs persisted expectations |
| Demo Admin tools (services/staff/rota/vouchers/pages/social/theme/csv) | Working (local) | `demo-business-admin-page.tsx` | Medium | Avoid implying persisted live data |
| Setup request persistence | Working + fallback | `setup-request-form.tsx`, `/api/setup-requests` | Low | Add monitoring and retry UX |
| Platform admin auth | Working | `/admin/login`, NextAuth | Low | Continue hardening |
| Subscriber provisioning records | Working | `/admin/sites`, repo/api layers | Medium | Workflow UX polish |
| Site-admin auth | Working | `/site-admin/login`, `site-admin.ts` | Low | Add account lifecycle tooling |
| Persisted site settings | Working | `/site-admin/[slug]`, `/admin/sites/[id]/settings` | Low | Add field-level audit logs later |
| Persisted services | Working | same | Low | service-role price parity |
| Persisted staff/roles | Working | same | Low | role governance polish |
| Persisted rota/breaks/closures/holidays | Working | same | Medium | wire to live slot engine |
| Persisted bookings | Working (admin/site-admin flows) | booking repos/APIs + preview | Medium | broader management UI |
| Public tenant route (`/sites/[slug]`) | Working | `src/app/sites/[siteSlug]/*` | Medium | domain-based runtime hook-in |
| Domain resolver readiness | Working (diagnostic-ready) | `tenant-resolver.ts`, `/api/site-resolve-debug` | Medium | middleware/proxy integration |
| Custom domain live routing | Missing (by design) | N/A | Medium | implement host-based render path |
| Payment checkout/capture | Missing | N/A | **High (commercial)** | define payment milestone and UX |
| Payment setup intent config | Working (persisted) | settings schema/UI | Medium | tie into policy/public copy |
| Email auto-response provider | Mock/local | demo/local notification flow | Medium | provider integration plan |
| Twilio/WhatsApp | Missing/removed publicly | N/A | Low | roadmap only |
| Vouchers | Working (demo/local) | demo pages + local voucher libs | Medium | persisted voucher model later |
| Social icons | Working | `social-platforms.ts`, `/public/icons/social/*`, tenant/demo UI | Low | visual QA across themes |
| Logo/favicon upload | Working (tenant branding slice) | site-admin branding APIs/UI | Medium | metadata + cache strategy |
| Persisted page content/social links | Working | site-admin settings + `/sites/[slug]` subroutes | Medium | add richer content editor |
| Customer auth (real) | Missing | N/A | Medium | future milestone |
| Staff auth (real) | Missing | N/A | Medium | future milestone |
| Business owner auth | Working (foundational) | `/site-admin/*` | Medium | role expansion |
| CRM | Working (platform admin level) | `/admin/crm` | Low | data quality checks |
| Sales pipeline | Working (platform admin level) | `/admin/sales` | Low | conversion reporting |
| CSV import/export | Working (demo/local) | `demo-business-admin-page.tsx`, csv tools | Medium | persisted import pipeline |
| Analytics/financials | Partial/local | scattered demo/admin indicators | Medium | define KPI model |

## 6. Backend / Live-Site Architecture Status
- Shared-app + central DB + `tenantSiteId` scoping: **Aligned**.
- Per-customer DB/code-export assumption: **Not present in current architecture docs/code paths**.
- Slug proof route (`/sites/[siteSlug]`): **Implemented and functional**.
- Domain resolver readiness (`SiteDomain.domain -> TenantSite`): **Implemented (resolver + debug endpoint)**.
- Live host/domain middleware routing: **Not yet live**.
- Platform admin vs business admin separation: **Mostly good** (auth/session and route boundaries are explicit).

## 7. UX/UI Findings
### Strong
- Homepage structure and value messaging are much improved.
- Demo nav contrast classes are explicit and robust.
- Social icons now real assets and displayed in contact area.

### Gaps
1. Legacy customiser page still reads as a primary editing flow and includes obsolete mock login credentials display.
2. Public/global `/account` route is still a mock portal and can confuse prospects if discovered via header/footer.
3. Some public-facing areas still include “mock/local demo foundation” wording that weakens commercial trust.
4. Demo root vs subpage explanatory pattern is not fully unified.
5. Template/theme combinations likely still need visual QA pass on real devices (no automated visual checks in repo).

## 8. Security/Privacy Findings
### Positive
- Platform admin APIs protected by platform admin session checks.
- Site-admin APIs enforce tenant scope by slug + session tenant ID match.
- Public tenant booking route resolves tenant server-side by slug.
- No payment secrets/card details fields introduced in subscriber payment setup intent.

### Risks
1. `GET /api/setup-requests/[id]` remains publicly readable by opaque ID (explicitly documented as temporary). **Needs hardening.**
2. Public data exposure checks rely on route discipline; no central policy middleware for all future tenant/public expansions yet.

## 9. Prioritised Gap List
## P0 (Must fix before serious selling)
1. Remove/de-emphasise legacy `/demo/[industry]/customise` as primary path and clean copy/buttons that conflict with business-admin-first journey.
2. Remove obsolete demo login credential placeholder content from any conversion-facing flow (especially customiser panel).
3. Harden setup request read endpoint (`GET /api/setup-requests/[id]`) with signed token or scoped auth.
4. Ensure every funnel CTA sequence is consistent: industry page + demo routes should push `Get your site now` / `Start setup` without mixed legacy wording.
5. Remove or isolate public-facing “mock/local foundation” language from prospect-facing surfaces.
6. Decide and present payment-step truth clearly in setup (explicit placeholder, no ambiguity).

## P1 (Should fix before beta customers)
1. Unify demo explanation header/blue-box behavior across root and all demo subpages.
2. Add clear public contact/support path for MyExperiment.club (not just demo business contact).
3. Align demo local booking/account behavior with persisted architecture expectations (clear labels and boundaries).
4. Expand persisted public site UX parity (about/contact/policy polish, richer content rendering).
5. Add route-level UX regression checklist for nav contrast + CTA visibility.
6. Clarify global `/account` purpose or hide from main prospect navigation.

## P2 (After launch / roadmap)
1. Live custom-domain host routing middleware/proxy integration.
2. Payment provider integration (checkout, webhooks, reconciliation).
3. Real customer auth and staff auth.
4. Email provider integration for real transactional notifications.
5. Voucher persistence + financial reporting depth.
6. Advanced analytics and dashboards.

## 10. Recommended Next Task Sequence
1. **Conversion-path cleanup pass**: remove legacy customiser primacy, unify CTA labels/targets across `/[industry]`, `/demo/*`, `/setup/*`.
2. **Security hardening pass**: lock down `GET /api/setup-requests/[id]` with signed token approach.
3. **Public copy trust pass**: eliminate non-essential mock/local wording on marketing/prospect routes.
4. **Demo consistency pass**: standardize intro/blue explanation module across all demo pages.
5. **Support/contact pass**: add clear platform-level contact/help route and link from homepage/setup.
6. **Setup/payment truth pass**: explicit “payment step pending/manual” messaging + state model.
7. **Tenant public UX parity pass**: polish `/sites/[slug]` + about/contact/policy rendering and nav consistency.
8. **Domain routing integration pass**: wire host-based tenant resolution (without DNS automation).
9. **Subscriber admin UX pass**: improve site-admin IA and save-state feedback for day-to-day owner tasks.
10. **Observability pass**: add route/journey checks and basic event instrumentation for conversion funnel.

## 11. Open Questions
1. Should `/demo/[industry]/customise` be removed, redirected, or retained as an optional side path only?
2. Do we want global `/account` accessible publicly at all before customer auth exists?
3. For setup confirmation lookup, is signed token preferred over authenticated retrieval for v1?
4. What is the intended pre-payment process: manual invoice, payment link, or deferred billing?
5. Should platform-level “Contact us” be email-only first, or include a minimal persisted lead form?
## P0 conversion cleanup applied (2026-05-26)
- `/demo/[industry]/customise` is retained only as a transition page and no longer presents the full editing workflow.
- Transition page now directs users to:
  - `/demo/[industry]` (Open demo site)
  - `/demo/[industry]/admin` (Open Admin View)
  - `/setup/[industry]` (Get your site now)
- Industry page CTAs now prioritize:
  - `View demo site`
  - `Get your site now`
- Public header/footer no longer promote the legacy global `/account` route.
- Conversion-facing copy now avoids implying that demo content is automatically copied into live subscriber sites.
- Setup wording now clearly frames payment as an onboarding confirmation step, not live checkout.

## P0 security hardening applied: setup confirmation token (2026-05-26)
- Public `GET /api/setup-requests/[id]` no longer allows read-by-id alone.
- Confirmation access now requires a token query param for non-admin callers.
- Platform admin session can still read setup requests without confirmation token.
- Setup confirmation links now include a one-time-style high-entropy token parameter.
- Token plaintext is returned only at create time and not exposed in list/admin reads.

## Public contact/support route (2026-05-26)
- Added public `/contact` route for prospect questions and setup support.
- Added persisted `ContactEnquiry` backend model and admin handling workflow.
- Contact route is designed for pre-order and setup help without requiring login.
- No email provider integration yet; enquiries are persisted and handled from platform admin.

 # #   P 1   s e t u p / p a y m e n t   m e s s a g i n g   c l e a n u p   a p p l i e d   ( 2 0 2 6 - 0 5 - 2 6 ) 
 -   S e t u p   p a g e   n o w   p r e s e n t s   a   c l e a r e r   o r d e r   s u m m a r y   w i t h   e x p l i c i t   s e t u p / m o n t h l y / d o m a i n   a m o u n t s . 
 -   D o m a i n   c h o i c e   w o r d i n g   n o w   s u p p o r t s : 
     -   e x i s t i n g   d o m a i n 
     -   n e e d   a   n e w   d o m a i n 
     -   n o t   s u r e   y e t 
 -   S e t u p   c o n f i r m a t i o n   n o w   e x p l i c i t l y   s t a t e s   n o   p a y m e n t   h a s   b e e n   t a k e n   y e t . 
 -   P l a t f o r m   a d m i n   s e t u p - r e q u e s t   d e t a i l   n o w   i n c l u d e s   a   m a n u a l   c o m m e r c i a l - s t a t u s   p a n e l   f o r   d o m a i n / p a y m e n t   f o l l o w - u p . 
 -   F l o w   r e m a i n s   i n t e n t i o n a l l y   n o n - c h e c k o u t   i n   t h i s   p h a s e   ( n o   l i v e   S t r i p e / S q u a r e / P a y P a l   c a p t u r e ) .  
 

## Transactional email foundation applied (2026-05-26)
- Added Resend-based transactional email provider abstraction with fail-soft behavior.
- Setup, contact enquiry, and persisted booking flows now attempt email sends when configured.
- Missing or failed provider configuration no longer blocks core write flows.
- Bulk marketing, Twilio/WhatsApp, unsubscribe systems, and payment emails remain out of scope.


## P0/P1 follow-up update (2026-05-30)
- Applied UI simplification pass: subscriber-facing appearance controls are now `Light`/`Dark` only.
- Removed redundant hero booking CTA from demo/public homepage hero surfaces.
- Cleaned social icon presentation to remove dark circular wrappers.
- Transactional email smoke pass confirms fail-soft behavior: request/enquiry/booking persistence succeeds while email can return provider failure status without blocking core flow.

## 2026-05-30 audit follow-up
- Fixed voucher CTA route mismatch (now points to dedicated demo vouchers purchase page).
- Improved operations-first admin flow by defaulting Demo Admin to Bookings dashboard.
- Added explicit cancelled-status visibility in Staff View with high-contrast red badge.

## P0 conversion follow-up applied (2026-05-30)
- Homepage hero CTA row now uses Order now as the third primary action.
- Setup route (/setup/[industry]) was simplified into an order-start flow with Step 1 website-type selection.
- Setup page removed non-essential explainer sections that were adding friction in the funnel.
- Order summary copy is now cleaner and keeps payment/domain confirmation as a concise next-step note.
- Backend model naming remains SetupRequest and confirmation remains token-hardened.

## P1 follow-up applied (2026-05-30): recurring/block-booking foundations
- Added controlled recurring service and block-booking configuration in business-admin surfaces.
- Added public/demo service badges to make recurring/block-booking availability visible without overpromising automation.
- Added recurring-payment-issues placeholder panel for operational readiness (no provider sync yet).
