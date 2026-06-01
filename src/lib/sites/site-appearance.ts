export type SiteAppearanceMode = "LIGHT" | "DARK";
import type { SiteVisualTemplateId } from "@/lib/sites/site-visual-templates";
import type { SiteColourSchemeId } from "@/lib/sites/site-colour-schemes";

const LIGHT_THEME_ID = "modern-minimalist";
const LIGHT_PALETTE_ID = "slate-teal";
const DARK_THEME_ID = "urban-hipster";
const DARK_PALETTE_ID = "black-neon-green";
const LEGACY_THEME_IDS = new Set([
  "premium",
  "bold-edge",
  "classic-immersive",
  "utility-list",
  "split-screen",
  "modern-minimalist",
  "vintage-classic",
  "urban-hipster",
  "luxury-elegant",
  "rustic-warm",
]);
const LEGACY_PALETTE_IDS = new Set([
  "black-neon-green",
  "charcoal-electric-blue",
  "black-hot-coral",
  "navy-gold",
  "emerald-champagne",
  "aubergine-pearl",
  "slate-teal",
]);

function parseExplicitAppearance(value?: string | null): SiteAppearanceMode | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "dark") return "DARK";
  if (normalized === "light") return "LIGHT";
  return null;
}

export function normalizeSiteAppearance(
  visualThemeId?: string | null,
  colourPaletteId?: string | null,
): SiteAppearanceMode {
  const explicitThemeAppearance = parseExplicitAppearance(visualThemeId);
  if (explicitThemeAppearance) {
    return explicitThemeAppearance;
  }
  const explicitPaletteAppearance = parseExplicitAppearance(colourPaletteId);
  if (explicitPaletteAppearance) {
    return explicitPaletteAppearance;
  }

  // Only treat the current supported dark pair as an explicit dark selection.
  if (visualThemeId === DARK_THEME_ID && colourPaletteId === DARK_PALETTE_ID) {
    return "DARK";
  }

  // Legacy theme/palette values are normalized to clean light mode by default.
  if (
    (visualThemeId && LEGACY_THEME_IDS.has(visualThemeId)) ||
    (colourPaletteId && LEGACY_PALETTE_IDS.has(colourPaletteId))
  ) {
    return "LIGHT";
  }

  // Unknown values should never force legacy dark/premium rendering.
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
