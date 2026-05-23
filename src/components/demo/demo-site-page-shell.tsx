"use client";

import { ReactNode } from "react";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { CustomerSiteSettings } from "@/lib/sites/site-settings-types";
import { WebsiteTemplate } from "@/lib/sites/types";

type DemoSitePageShellProps = {
  template: WebsiteTemplate;
  settings: CustomerSiteSettings;
  children: ReactNode;
};

export function DemoSitePageShell({
  template,
  settings,
  children,
}: DemoSitePageShellProps) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-white shadow-sm sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          {template.category} demo
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {template.category} customer site
        </h1>
        <p className="mt-2 text-sm text-slate-200">
          Public-facing site preview with service pages, booking journey, and customer
          portal routes.
        </p>
        <div className="mt-4">
          <DemoSiteNav
            templateSlug={template.slug}
            showAbout={settings.pageVisibility.about.enabled}
            showContact={settings.pageVisibility.contact.enabled}
            showPolicy
          />
        </div>
      </section>
      {children}
    </main>
  );
}
