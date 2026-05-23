"use client";

import { ReactNode } from "react";
import { DemoSiteIntroBanner } from "@/components/demo/demo-site-intro-banner";
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
      <DemoSiteIntroBanner template={template} />
      <section className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-white shadow-sm sm:px-6">
        <DemoSiteNav
          templateSlug={template.slug}
          showAbout={settings.pageVisibility.about.enabled}
          showContact
          showPolicy={settings.pageVisibility.policy?.enabled ?? true}
        />
      </section>
      {children}
    </main>
  );
}
