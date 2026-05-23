export type SiteColourSchemeId = "calm-blue" | "fresh-green" | "warm-coral";

export type SiteColourScheme = {
  id: SiteColourSchemeId;
  name: string;
  accentButtonClass: string;
  accentTextClass: string;
  accentSoftClass: string;
  lightBackgroundClass: string;
  lightSurfaceClass: string;
  darkBackgroundClass: string;
  darkSurfaceClass: string;
};

export const SITE_COLOUR_SCHEMES: SiteColourScheme[] = [
  {
    id: "calm-blue",
    name: "Calm Blue",
    accentButtonClass: "bg-sky-700 hover:bg-sky-800 text-white",
    accentTextClass: "text-sky-700",
    accentSoftClass: "bg-sky-100 text-sky-900 border-sky-200",
    lightBackgroundClass: "bg-slate-50",
    lightSurfaceClass: "bg-white",
    darkBackgroundClass: "bg-slate-950 text-white",
    darkSurfaceClass: "bg-slate-900 text-white",
  },
  {
    id: "fresh-green",
    name: "Fresh Green",
    accentButtonClass: "bg-emerald-700 hover:bg-emerald-800 text-white",
    accentTextClass: "text-emerald-700",
    accentSoftClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    lightBackgroundClass: "bg-emerald-50",
    lightSurfaceClass: "bg-white",
    darkBackgroundClass: "bg-emerald-950 text-white",
    darkSurfaceClass: "bg-emerald-900 text-white",
  },
  {
    id: "warm-coral",
    name: "Warm Coral",
    accentButtonClass: "bg-orange-600 hover:bg-orange-700 text-white",
    accentTextClass: "text-orange-700",
    accentSoftClass: "bg-orange-100 text-orange-900 border-orange-200",
    lightBackgroundClass: "bg-orange-50",
    lightSurfaceClass: "bg-white",
    darkBackgroundClass: "bg-zinc-950 text-white",
    darkSurfaceClass: "bg-zinc-900 text-white",
  },
];

export function getSiteColourSchemeById(id?: string): SiteColourScheme {
  return SITE_COLOUR_SCHEMES.find((item) => item.id === id) ?? SITE_COLOUR_SCHEMES[0];
}
