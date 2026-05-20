import { ComponentPropsWithoutRef, ReactNode } from "react";
import { siteTheme } from "@/lib/ui/site-theme";

type SiteSectionProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"section">, "className" | "children">;

export function SiteSection({ title, eyebrow, children, className = "", ...props }: SiteSectionProps) {
  return (
    <section {...props} className={`rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 ${className}`}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p> : null}
      {title ? <h2 className={`mt-2 text-2xl font-semibold ${siteTheme.headingText}`}>{title}</h2> : null}
      <div className={title || eyebrow ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
