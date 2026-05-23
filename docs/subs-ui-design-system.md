# Subs UI Design System (Local Mock)

## Direction
The customer-facing UI uses a neutral tile/card system designed for local-business websites:
- off-white/light grey page surfaces
- dark rounded hero panels
- large rounded cards and tiles
- soft shadows and generous spacing
- strong, readable typography
- clear high-contrast CTA hierarchy

## Reusable primitives
Primary reusable components live in `src/components/site-ui/`:
- `site-shell.tsx`
- `site-hero.tsx`
- `site-section.tsx`
- `site-card.tsx`
- `site-service-grid.tsx`
- `site-cta-panel.tsx`
- `site-footer-block.tsx`
- `site-brand-mark.tsx`

Theme token helpers live in `src/lib/ui/site-theme.ts`.

## Logo fallback principle
No upload is required for a presentable preview. `SiteBrandMark` provides an intentional text-first fallback (initial mark + name/tagline) so demos still look polished without assets.

## CTA hierarchy
- Primary CTA: high-contrast filled action (`Start setup` / conversion)
- Secondary CTA: neutral filled/light action (`Create my own site`)
- Outline CTA: low-emphasis utility action (`View demo site`)

## Hero and section usage
- Customer/industry pages use dark hero cards with strong headline + CTA row.
- Service and workflow content is presented as tiles/cards.
- Demo pages use the same visual language so preview feels like a real site.

## Custom colours later
Default theme remains neutral so it suits all 14 launch industries. Customer-specific brand colours are still supported through customisation data and can be layered onto this system later.

## Current limitations
- Still local/mock architecture and browser-local persistence.
- Not a full design token engine yet.
- No real media upload pipeline.
- Admin pages are intentionally less styled than public pages.

## Homepage alignment
- src/components/marketing/marketing-home.tsx now uses site-ui primitives (SiteHero, SiteSection, SiteCard, SiteCtaPanel) for the same neutral card/tile language used on industry and demo pages.
- Homepage hero, industry catalogue, pricing, how-it-works, trust messaging, and FAQ are visually consistent with the wider public journey.
- Trust/capability now uses a softer checklist pattern (green tick markers, lighter rows) to avoid a heavy box-per-item look.
- FAQ now uses a client-side accordion pattern with clickable question buttons and `aria-expanded` state.
- Homepage industry cards now trigger a split journey:
  - open demo in new tab/window
  - keep current tab on the matching industry sales page
- Demo/customisation wording now uses `Create my own site` for clearer conversion intent.
- Homepage industry discovery is now category-first with click-to-reveal industry lists.
- Category order is:
  - Hair, Beauty & Wellness
  - Home Services
  - Transport
  - Learning
- Public homepage copy emphasizes:
  - managed website + booking tools
  - simple one-package pricing
  - live-site target within a day when details/domain are ready
- Public-facing marketing copy no longer promotes WhatsApp add-on pricing.


## Homepage CTA + FAQ refresh (2026-05)
- Homepage hero buttons now use explicit high-contrast hierarchy to prevent low-contrast text on light surfaces.
- Trust/value block now features a lead wide tile (`Business tools included`) above secondary value tiles.
- FAQ content was replaced with an expanded sales-focused set while keeping claims aligned to current product state.
- Hero CTA readability pass also enforces high-contrast text on `View example demo` and `How it works`.
- Trust/value lead tile wording is now `Includes ALL business tools` with updated supporting conversion copy.

## Demo visual system variants
Customer-facing `/demo/[industry]` now supports multiple visual layout modes (selected from business admin):
- Modern Minimalist
- Bold Edge
- Classic Immersive
- Utility List
- Split-Screen Contemporary

Colour schemes (Calm Blue, Fresh Green, Warm Coral, Midnight Lime) alter accent/button/surface feel while keeping readability and responsive behavior.

## Template propagation behavior
- Template and colour changes made in `/demo/[industry]/admin` now persist immediately for the selected industry.
- `/demo/[industry]` listens for local settings updates and re-reads local settings on focus/update so the selected visual style is consistently reflected.
- Midnight Lime is the dark premium option intended for dark-themed presentation with high-contrast lime accents.
- Demo nav labels now use:
  - `Customer View`
  - `Staff View`
  - `Admin View`
- Demo credential cards were removed from customer-facing and business-admin demo surfaces.
- Template layouts were strengthened so each option has more obvious differences in hero structure, card/list shape, and typography feel.

## Demo nav/readability and template polish
- Active demo nav pill contrast now forces readable selected state regardless of container theme.
- Split-screen contemporary template layout was adjusted for cleaner 50/50 desktop hero and stable stacked mobile behavior.
- Demo homepage removed portal-access tile and now ends with a combined contact/opening-hours tile.
