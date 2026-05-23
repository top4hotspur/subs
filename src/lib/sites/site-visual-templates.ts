export type SiteVisualTemplateId =
  | "modern-minimalist"
  | "bold-edge"
  | "classic-immersive"
  | "utility-list"
  | "split-screen-contemporary";

export type SiteVisualTemplateOption = {
  id: SiteVisualTemplateId;
  name: string;
  description: string;
  bestFor: string[];
};

export const SITE_VISUAL_TEMPLATES: SiteVisualTemplateOption[] = [
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    description:
      "Clean, airy, lightweight layout for salons, beauticians, cleaners and modern service brands.",
    bestFor: ["Hair", "Beauty", "Cleaners", "Wellness"],
  },
  {
    id: "bold-edge",
    name: "Bold Edge",
    description:
      "Premium dark-mode layout for barbers, private hire, mobile valeting and bold brands.",
    bestFor: ["Barbers", "Taxi/private hire", "Mobile valeting"],
  },
  {
    id: "classic-immersive",
    name: "Classic Immersive",
    description: "Established, professional full-width layout.",
    bestFor: ["Professional services", "Traditional local businesses"],
  },
  {
    id: "utility-list",
    name: "Utility List",
    description:
      "Structured practical layout for trades, driving instructors, cleaning, window cleaning and quote-led services.",
    bestFor: ["Trades", "Driving instructors", "Quote-led services"],
  },
  {
    id: "split-screen-contemporary",
    name: "Split-Screen Contemporary",
    description:
      "Modern 50/50 hero layout that works well for premium service brands.",
    bestFor: ["Premium service brands", "Modern teams"],
  },
];

export function getSiteVisualTemplateById(id?: string): SiteVisualTemplateOption {
  return (
    SITE_VISUAL_TEMPLATES.find((item) => item.id === id) ??
    SITE_VISUAL_TEMPLATES[0]
  );
}
