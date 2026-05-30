export type SiteAppearanceMode = "LIGHT" | "DARK";

const LIGHT_THEME_ID = "modern-minimalist";
const LIGHT_PALETTE_ID = "slate-teal";
const DARK_THEME_ID = "urban-hipster";
const DARK_PALETTE_ID = "black-neon-green";

export function resolveAppearanceMode(
  visualThemeId?: string | null,
): SiteAppearanceMode {
  return visualThemeId === DARK_THEME_ID ? "DARK" : "LIGHT";
}

export function mapAppearanceToTheme(mode: SiteAppearanceMode): {
  visualThemeId: string;
  colourPaletteId: string;
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
