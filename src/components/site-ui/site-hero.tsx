import { ReactNode } from "react";
import { siteSectionClass, siteSurfaceClass, siteTheme } from "@/lib/ui/site-theme";

type SiteHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
  actions?: ReactNode;
  helperText?: string;
};

export function SiteHero({ eyebrow, title, subtitle, dark = true, actions, helperText }: SiteHeroProps) {
  const panelClass = dark ? `${siteTheme.darkPanel} border border-slate-800` : siteSurfaceClass;
  return (
    <section className={`${panelClass} ${siteSectionClass} shadow-lg`}>
      {eyebrow ? <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${dark ? "text-sky-200" : "text-sky-700"}`}>{eyebrow}</p> : null}
      <h1 className={`mt-3 text-4xl font-bold tracking-tight sm:text-5xl ${dark ? "text-white" : siteTheme.headingText}`}>{title}</h1>
      {subtitle ? <p className={`mt-4 max-w-3xl text-lg ${dark ? "text-slate-200" : siteTheme.mutedText}`}>{subtitle}</p> : null}
      {helperText ? <p className={`mt-3 max-w-3xl text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{helperText}</p> : null}
      {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}

