import type { SiteColourSchemeId } from "@/lib/sites/site-colour-schemes";

export type SiteVisualTemplateId =
  | "modern-minimalist"
  | "vintage-classic"
  | "urban-hipster"
  | "luxury-elegant"
  | "rustic-warm";

export type LegacySiteVisualTemplateId =
  | "bold-edge"
  | "classic-immersive"
  | "utility-list"
  | "split-screen-contemporary";

export type SiteVisualTemplateOption = {
  id: SiteVisualTemplateId;
  name: string;
  description: string;
  bestFor: string[];
  allowedPalettes: SiteColourSchemeId[];
};

export const SITE_VISUAL_TEMPLATES: SiteVisualTemplateOption[] = [
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    description: "Clean, airy, neutral, premium-simple.",
    bestFor: ["beauty", "salons", "cleaners", "tutors"],
    allowedPalettes: ["slate-teal", "soft-blue", "warm-neutral"],
  },
  {
    id: "vintage-classic",
    name: "Vintage Classic",
    description: "Traditional, warm, trusted, established.",
    bestFor: ["barbers", "tutors", "driving instructors", "local family businesses"],
    allowedPalettes: ["red-cream", "wood-brass", "ink-ivory"],
  },
  {
    id: "urban-hipster",
    name: "Urban Hipster",
    description: "Dark, bold, edgy, younger.",
    bestFor: ["barbers", "mobile valeting", "bold service brands"],
    allowedPalettes: ["black-neon-green", "charcoal-electric-blue", "black-hot-coral"],
  },
  {
    id: "luxury-elegant",
    name: "Luxury Elegant",
    description: "Premium, refined, high-end.",
    bestFor: ["massage", "beauticians", "hairdressers", "private hire"],
    allowedPalettes: ["navy-gold", "emerald-champagne", "aubergine-pearl"],
  },
  {
    id: "rustic-warm",
    name: "Rustic Warm",
    description: "Friendly, grounded, practical, local.",
    bestFor: ["gardeners", "dog grooming", "cleaners", "window cleaning"],
    allowedPalettes: ["olive-sand", "terracotta-cream", "brown-sage"],
  },
];

const LEGACY_TEMPLATE_MAP: Record<LegacySiteVisualTemplateId, SiteVisualTemplateId> = {
  "bold-edge": "urban-hipster",
  "classic-immersive": "vintage-classic",
  "utility-list": "rustic-warm",
  "split-screen-contemporary": "luxury-elegant",
};

export function normalizeSiteVisualTemplateId(id?: string): SiteVisualTemplateId {
  if (!id) return "modern-minimalist";
  if (
    id === "modern-minimalist" ||
    id === "vintage-classic" ||
    id === "urban-hipster" ||
    id === "luxury-elegant" ||
    id === "rustic-warm"
  ) {
    return id;
  }
  if (id in LEGACY_TEMPLATE_MAP) {
    return LEGACY_TEMPLATE_MAP[id as LegacySiteVisualTemplateId];
  }
  return "modern-minimalist";
}

export function getSiteVisualTemplateById(id?: string): SiteVisualTemplateOption {
  const normalized = normalizeSiteVisualTemplateId(id);
  return (
    SITE_VISUAL_TEMPLATES.find((item) => item.id === normalized) ??
    SITE_VISUAL_TEMPLATES[0]
  );
}
