export type SiteAppearanceMode = "LIGHT" | "DARK";
import type { SiteVisualTemplateId } from "@/lib/sites/site-visual-templates";
import type { SiteColourSchemeId } from "@/lib/sites/site-colour-schemes";

const LIGHT_THEME_ID = "modern-minimalist";
const LIGHT_PALETTE_ID = "slate-teal";
const DARK_THEME_ID = "urban-hipster";
const DARK_PALETTE_ID = "black-neon-green";
const LEGACY_DARK_THEME_IDS = new Set(["urban-hipster", "luxury-elegant"]);
const LEGACY_DARK_PALETTE_IDS = new Set([
  "black-neon-green",
  "charcoal-electric-blue",
  "black-hot-coral",
  "navy-gold",
  "emerald-champagne",
  "aubergine-pearl",
]);

export function normalizeSiteAppearance(
  visualThemeId?: string | null,
  colourPaletteId?: string | null,
): SiteAppearanceMode {
  if (visualThemeId && LEGACY_DARK_THEME_IDS.has(visualThemeId)) {
    return "DARK";
  }
  if (colourPaletteId && LEGACY_DARK_PALETTE_IDS.has(colourPaletteId)) {
    return "DARK";
  }
  return "LIGHT";
}

export function resolveAppearanceMode(
  visualThemeId?: string | null,
  colourPaletteId?: string | null,
): SiteAppearanceMode {
  return normalizeSiteAppearance(visualThemeId, colourPaletteId);
}

export function mapAppearanceToTheme(mode: SiteAppearanceMode): {
  visualThemeId: SiteVisualTemplateId;
  colourPaletteId: SiteColourSchemeId;
} {
  if (mode === "DARK") {
    return {
      visualThemeId: DARK_THEME_ID,
      colourPaletteId: DARK_PALETTE_ID,
    };
  }
  return {
    visualThemeId: LIGHT_THEME_ID,
    colourPaletteId: LIGHT_PALETTE_ID,
  };
}

export function isDarkThemeId(visualThemeId?: string | null): boolean {
  return resolveAppearanceMode(visualThemeId) === "DARK";
}
