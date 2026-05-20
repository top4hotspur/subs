import { ReactNode } from "react";

type SiteCardProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  dark?: boolean;
};

export function SiteCard({ title, subtitle, children, dark = false }: SiteCardProps) {
  const base = dark
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-100"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <article className={base}>
      {title ? <h3 className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{title}</h3> : null}
      {subtitle ? <p className={`mt-2 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{subtitle}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </article>
  );
}

