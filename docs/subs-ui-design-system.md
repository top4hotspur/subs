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

## Demo theme system (local mock)`r`nCustomer-facing `/demo/[industry]` now uses a controlled theme + palette model:`r`n- Themes: Modern Minimalist, Vintage Classic, Urban Hipster, Luxury Elegant, Rustic Warm`r`n- Each theme has exactly 3 curated colour palettes (no free colour picker).`r`n`r`nThe launch design direction is intentionally controlled so subscribers can pick meaningful styles without creating messy combinations.`r`n`r`n## Theme personalities
- Template and colour changes made in `/demo/[industry]/admin` now persist immediately for the selected industry.
- `/demo/[industry]` listens for local settings updates and re-reads local settings on focus/update so the selected visual style is consistently reflected.
- Midnight Lime is the dark premium option intended for dark-themed presentation with high-contrast lime accents.
- Demo nav labels now use:
  - `Customer View`
  - `Staff View`
  - `Admin View`
- Demo credential cards were removed from customer-facing and business-admin demo surfaces.
- Template layouts were strengthened so each option has more obvious differences in hero structure, card/list shape, and typography feel.

## Theme personalities`r`n- Modern Minimalist: airy light surfaces, soft shadows, rounded cards.`r`n- Vintage Classic: cream/warm traditional presentation with formal card borders.`r`n- Urban Hipster: dark bold treatment with punchy accents and sharper cards.`r`n- Luxury Elegant: premium refined presentation with polished hero/panel treatment.`r`n- Rustic Warm: earthy practical style with friendly local-business tone.`r`n`r`n## Palette model`r`n- Modern Minimalist: slate-teal, soft-blue, warm-neutral`r`n- Vintage Classic: red-cream, wood-brass, ink-ivory`r`n- Urban Hipster: black-neon-green, charcoal-electric-blue, black-hot-coral`r`n- Luxury Elegant: navy-gold, emerald-champagne, aubergine-pearl`r`n- Rustic Warm: olive-sand, terracotta-cream, brown-sage`r`n`r`n## Theme propagation behavior`r`n- Theme and palette selections saved in `/demo/[industry]/admin` persist immediately in local settings.`r`n- `/demo/[industry]` listens for local updates and reflects visual changes without backend persistence.`r`n- Legacy template IDs and colour IDs are mapped to the new theme/palette model for backward compatibility.`r`n`r`n## Image policy for launch`r`n- No required image uploads for a professional result.`r`n- Themes are designed to look strong using typography, spacing, cards, borders, gradients, and colour.`r`n- Optional business photos can be added later.

## 2026-05-30 update: launch appearance simplification
- Launch subscriber-facing controls now expose only a simple `Site appearance` selector: `Light` or `Dark`.
- Advanced theme/palette infrastructure remains in code/data for internal mapping and backward compatibility, but is hidden from subscriber launch UI.
- Hero-level booking CTA was removed from homepage hero areas; booking actions remain on service tiles and booking routes.
- Social icons render as direct platform icons without extra dark circular wrappers.
