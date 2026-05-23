import type { SiteVisualTemplateId } from "@/lib/sites/site-visual-templates";

export type SiteColourSchemeId =
  | "slate-teal"
  | "soft-blue"
  | "warm-neutral"
  | "red-cream"
  | "wood-brass"
  | "ink-ivory"
  | "black-neon-green"
  | "charcoal-electric-blue"
  | "black-hot-coral"
  | "navy-gold"
  | "emerald-champagne"
  | "aubergine-pearl"
  | "olive-sand"
  | "terracotta-cream"
  | "brown-sage";

type LegacySiteColourSchemeId =
  | "calm-blue"
  | "fresh-green"
  | "warm-coral"
  | "midnight-lime";

export type SiteColourScheme = {
  id: SiteColourSchemeId;
  themeId: SiteVisualTemplateId;
  name: string;
  pageBackgroundClass: string;
  heroBackgroundClass: string;
  heroPanelClass: string;
  textClass: string;
  mutedTextClass: string;
  accentButtonClass: string;
  accentTextClass: string;
  borderClass: string;
  cardClass: string;
};

export const SITE_COLOUR_SCHEMES: SiteColourScheme[] = [
  {
    id: "slate-teal",
    themeId: "modern-minimalist",
    name: "Slate Teal",
    pageBackgroundClass: "bg-slate-50",
    heroBackgroundClass: "bg-slate-100",
    heroPanelClass: "bg-white",
    textClass: "text-slate-900",
    mutedTextClass: "text-slate-600",
    accentButtonClass: "bg-teal-700 text-white hover:bg-teal-800",
    accentTextClass: "text-teal-700",
    borderClass: "border-slate-200",
    cardClass: "bg-white border border-slate-200 shadow-md rounded-2xl",
  },
  {
    id: "soft-blue",
    themeId: "modern-minimalist",
    name: "Soft Blue",
    pageBackgroundClass: "bg-blue-50",
    heroBackgroundClass: "bg-sky-100",
    heroPanelClass: "bg-white",
    textClass: "text-slate-900",
    mutedTextClass: "text-slate-600",
    accentButtonClass: "bg-sky-700 text-white hover:bg-sky-800",
    accentTextClass: "text-sky-700",
    borderClass: "border-blue-200",
    cardClass: "bg-white border border-blue-100 shadow-md rounded-2xl",
  },
  {
    id: "warm-neutral",
    themeId: "modern-minimalist",
    name: "Warm Neutral",
    pageBackgroundClass: "bg-stone-50",
    heroBackgroundClass: "bg-stone-100",
    heroPanelClass: "bg-white",
    textClass: "text-stone-900",
    mutedTextClass: "text-stone-600",
    accentButtonClass: "bg-amber-700 text-white hover:bg-amber-800",
    accentTextClass: "text-amber-700",
    borderClass: "border-stone-200",
    cardClass: "bg-white border border-stone-200 shadow-md rounded-2xl",
  },
  {
    id: "red-cream",
    themeId: "vintage-classic",
    name: "Red Cream",
    pageBackgroundClass: "bg-amber-50",
    heroBackgroundClass: "bg-rose-100",
    heroPanelClass: "bg-amber-100",
    textClass: "text-zinc-900",
    mutedTextClass: "text-zinc-700",
    accentButtonClass: "bg-rose-800 text-amber-50 hover:bg-rose-900",
    accentTextClass: "text-rose-800",
    borderClass: "border-amber-300",
    cardClass: "bg-amber-50 border-2 border-amber-300 rounded-xl",
  },
  {
    id: "wood-brass",
    themeId: "vintage-classic",
    name: "Wood Brass",
    pageBackgroundClass: "bg-orange-50",
    heroBackgroundClass: "bg-yellow-100",
    heroPanelClass: "bg-amber-100",
    textClass: "text-amber-950",
    mutedTextClass: "text-amber-800",
    accentButtonClass: "bg-amber-800 text-yellow-100 hover:bg-amber-900",
    accentTextClass: "text-amber-800",
    borderClass: "border-amber-400",
    cardClass: "bg-orange-50 border-2 border-amber-400 rounded-lg",
  },
  {
    id: "ink-ivory",
    themeId: "vintage-classic",
    name: "Ink Ivory",
    pageBackgroundClass: "bg-neutral-100",
    heroBackgroundClass: "bg-amber-50",
    heroPanelClass: "bg-neutral-50",
    textClass: "text-neutral-900",
    mutedTextClass: "text-neutral-700",
    accentButtonClass: "bg-neutral-900 text-amber-50 hover:bg-neutral-800",
    accentTextClass: "text-neutral-900",
    borderClass: "border-neutral-400",
    cardClass: "bg-neutral-50 border-2 border-neutral-400 rounded-lg",
  },
  {
    id: "black-neon-green",
    themeId: "urban-hipster",
    name: "Black Neon Green",
    pageBackgroundClass: "bg-neutral-950",
    heroBackgroundClass: "bg-black",
    heroPanelClass: "bg-neutral-900",
    textClass: "text-neutral-100",
    mutedTextClass: "text-neutral-300",
    accentButtonClass: "bg-lime-400 text-black hover:bg-lime-300",
    accentTextClass: "text-lime-300",
    borderClass: "border-neutral-700",
    cardClass: "bg-neutral-900 border border-neutral-700 rounded-md",
  },
  {
    id: "charcoal-electric-blue",
    themeId: "urban-hipster",
    name: "Charcoal Electric Blue",
    pageBackgroundClass: "bg-zinc-950",
    heroBackgroundClass: "bg-zinc-900",
    heroPanelClass: "bg-zinc-800",
    textClass: "text-zinc-100",
    mutedTextClass: "text-zinc-300",
    accentButtonClass: "bg-blue-500 text-zinc-950 hover:bg-blue-400",
    accentTextClass: "text-blue-300",
    borderClass: "border-zinc-700",
    cardClass: "bg-zinc-900 border border-zinc-700 rounded-md",
  },
  {
    id: "black-hot-coral",
    themeId: "urban-hipster",
    name: "Black Hot Coral",
    pageBackgroundClass: "bg-slate-950",
    heroBackgroundClass: "bg-black",
    heroPanelClass: "bg-slate-900",
    textClass: "text-slate-100",
    mutedTextClass: "text-slate-300",
    accentButtonClass: "bg-rose-500 text-white hover:bg-rose-400",
    accentTextClass: "text-rose-300",
    borderClass: "border-slate-700",
    cardClass: "bg-slate-900 border border-slate-700 rounded-md",
  },
  {
    id: "navy-gold",
    themeId: "luxury-elegant",
    name: "Navy Gold",
    pageBackgroundClass: "bg-slate-100",
    heroBackgroundClass: "bg-slate-900",
    heroPanelClass: "bg-slate-950",
    textClass: "text-slate-100",
    mutedTextClass: "text-slate-300",
    accentButtonClass: "bg-amber-400 text-slate-950 hover:bg-amber-300",
    accentTextClass: "text-amber-400",
    borderClass: "border-slate-700",
    cardClass: "bg-slate-900 border border-slate-700 rounded-xl shadow-lg",
  },
  {
    id: "emerald-champagne",
    themeId: "luxury-elegant",
    name: "Emerald Champagne",
    pageBackgroundClass: "bg-emerald-50",
    heroBackgroundClass: "bg-emerald-900",
    heroPanelClass: "bg-emerald-950",
    textClass: "text-emerald-50",
    mutedTextClass: "text-emerald-200",
    accentButtonClass: "bg-amber-200 text-emerald-950 hover:bg-amber-100",
    accentTextClass: "text-amber-200",
    borderClass: "border-emerald-700",
    cardClass: "bg-emerald-900 border border-emerald-700 rounded-xl shadow-lg",
  },
  {
    id: "aubergine-pearl",
    themeId: "luxury-elegant",
    name: "Aubergine Pearl",
    pageBackgroundClass: "bg-purple-50",
    heroBackgroundClass: "bg-purple-950",
    heroPanelClass: "bg-purple-900",
    textClass: "text-purple-50",
    mutedTextClass: "text-purple-200",
    accentButtonClass: "bg-fuchsia-200 text-purple-950 hover:bg-fuchsia-100",
    accentTextClass: "text-fuchsia-200",
    borderClass: "border-purple-700",
    cardClass: "bg-purple-900 border border-purple-700 rounded-xl shadow-lg",
  },
  {
    id: "olive-sand",
    themeId: "rustic-warm",
    name: "Olive Sand",
    pageBackgroundClass: "bg-lime-50",
    heroBackgroundClass: "bg-lime-100",
    heroPanelClass: "bg-lime-200",
    textClass: "text-lime-950",
    mutedTextClass: "text-lime-800",
    accentButtonClass: "bg-lime-800 text-lime-50 hover:bg-lime-900",
    accentTextClass: "text-lime-800",
    borderClass: "border-lime-300",
    cardClass: "bg-lime-50 border border-lime-300 rounded-2xl shadow-sm",
  },
  {
    id: "terracotta-cream",
    themeId: "rustic-warm",
    name: "Terracotta Cream",
    pageBackgroundClass: "bg-orange-50",
    heroBackgroundClass: "bg-orange-100",
    heroPanelClass: "bg-orange-200",
    textClass: "text-orange-950",
    mutedTextClass: "text-orange-800",
    accentButtonClass: "bg-orange-700 text-orange-50 hover:bg-orange-800",
    accentTextClass: "text-orange-700",
    borderClass: "border-orange-300",
    cardClass: "bg-orange-50 border border-orange-300 rounded-2xl shadow-sm",
  },
  {
    id: "brown-sage",
    themeId: "rustic-warm",
    name: "Brown Sage",
    pageBackgroundClass: "bg-stone-100",
    heroBackgroundClass: "bg-stone-200",
    heroPanelClass: "bg-emerald-100",
    textClass: "text-stone-900",
    mutedTextClass: "text-stone-700",
    accentButtonClass: "bg-emerald-800 text-emerald-50 hover:bg-emerald-900",
    accentTextClass: "text-emerald-800",
    borderClass: "border-stone-300",
    cardClass: "bg-stone-100 border border-stone-300 rounded-2xl shadow-sm",
  },
];

const LEGACY_COLOUR_MAP: Record<LegacySiteColourSchemeId, SiteColourSchemeId> = {
  "calm-blue": "slate-teal",
  "fresh-green": "olive-sand",
  "warm-coral": "terracotta-cream",
  "midnight-lime": "black-neon-green",
};

export function normalizeSiteColourSchemeId(id?: string): SiteColourSchemeId {
  if (!id) return "slate-teal";
  const found = SITE_COLOUR_SCHEMES.find((item) => item.id === id);
  if (found) return found.id;
  if (id in LEGACY_COLOUR_MAP) {
    return LEGACY_COLOUR_MAP[id as LegacySiteColourSchemeId];
  }
  return "slate-teal";
}

export function getSiteColourSchemeById(id?: string): SiteColourScheme {
  const normalized = normalizeSiteColourSchemeId(id);
  return (
    SITE_COLOUR_SCHEMES.find((item) => item.id === normalized) ??
    SITE_COLOUR_SCHEMES[0]
  );
}

export function getSiteColourSchemesForTheme(
  themeId: SiteVisualTemplateId,
): SiteColourScheme[] {
  return SITE_COLOUR_SCHEMES.filter((item) => item.themeId === themeId);
}
