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
Default theme remains neutral so it suits all 12 launch industries. Customer-specific brand colours are still supported through customisation data and can be layered onto this system later.

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
- Public homepage copy emphasizes:
  - managed website + booking tools
  - simple one-package pricing
  - live-site target within a day when details/domain are ready
- Public-facing marketing copy no longer promotes WhatsApp add-on pricing.

