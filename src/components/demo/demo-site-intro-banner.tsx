"use client";

import { WebsiteTemplate } from "@/lib/sites/types";

type DemoSiteIntroBannerProps = {
  template: WebsiteTemplate;
};

export function DemoSiteIntroBanner({ template }: DemoSiteIntroBannerProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-white shadow-sm sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
        {template.category} demo
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
        {template.category} customer site
      </h1>
      <p className="mt-2 text-sm text-slate-200">
        Public-facing site preview with service pages, booking journey, and customer
        account access.
      </p>
    </section>
  );
}
