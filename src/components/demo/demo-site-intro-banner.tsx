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
            {template.category}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">
            Explore the demo site and get a feel for how your own website could work. Make sure to look
            at the admin view too - that&apos;s where you&apos;ll see the full features, settings and control
            you could have over your business.
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
