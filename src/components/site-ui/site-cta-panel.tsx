import Link from "next/link";
import { ReactNode } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

type SiteCtaPanelProps = {
  title: string;
  subtitle?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  dark?: boolean;
  extra?: ReactNode;
};

export function SiteCtaPanel({
  title,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  dark = true,
  extra,
}: SiteCtaPanelProps) {
  return (
    <section className={`rounded-3xl border px-6 py-7 sm:px-8 ${dark ? "border-slate-800 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}>
      <h2 className={`text-2xl font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
      {subtitle ? <p className={`mt-2 ${dark ? "text-slate-300" : "text-slate-600"}`}>{subtitle}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={primaryHref} className={primaryButtonClass}>{primaryLabel}</Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className={dark ? primaryButtonClass : secondaryButtonClass}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
      {extra ? <div className="mt-3 text-sm">{extra}</div> : null}
    </section>
  );
}

