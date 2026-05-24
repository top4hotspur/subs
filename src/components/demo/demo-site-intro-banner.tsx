"use client";

import Link from "next/link";
import { WebsiteTemplate } from "@/lib/sites/types";
import { primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type DemoSiteIntroBannerProps = {
  template: WebsiteTemplate;
};

export function DemoSiteIntroBanner({ template }: DemoSiteIntroBannerProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-white shadow-sm sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            {template.category} demo
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {template.category} customer site
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">
            This demo shows the kind of site and tools your business can have. Explore the customer,
            staff and admin views, then get your own site when you&apos;re ready.
          </p>
        </div>
        <Link
          href={`/setup/${template.slug}`}
          className={`${primaryButtonClass} ${smallButtonClass} whitespace-nowrap`}
        >
          Get your site now
        </Link>
      </div>
    </section>
  );
}
